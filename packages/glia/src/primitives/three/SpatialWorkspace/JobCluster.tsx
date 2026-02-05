"use client";

/**
 * JobCluster - 3D visualization of jobs grouped by status
 *
 * Jobs are displayed as CrystallineOrganism primitives (tetrahedrons) in orbital
 * clusters around a central point, with running jobs at the center and other
 * statuses orbiting around them.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Job, JobStatus } from "@backbay/contract";
import { JOB_VISUALS } from "./types";
import type { JobClusterProps } from "./types";
import { CrystallineOrganism } from "../CrystallineOrganism";
import { jobAdapter } from "./adapters";

// -----------------------------------------------------------------------------
// Single Job Node
// -----------------------------------------------------------------------------

interface JobNodeProps {
  job: Job;
  position: THREE.Vector3;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function JobNode({ job, position, isSelected, isHovered, onClick, onHover }: JobNodeProps) {
  // Convert job to organism props using the adapter
  const organismProps = jobAdapter.toOrganism(job);

  return (
    <CrystallineOrganism
      {...organismProps}
      position={[position.x, position.y, position.z]}
      selected={isSelected}
      hovered={isHovered}
      onSelect={() => onClick()}
      onHover={(id) => onHover(id !== null)}
    />
  );
}

// -----------------------------------------------------------------------------
// Status Cluster
// -----------------------------------------------------------------------------

interface StatusClusterProps {
  jobs: Job[];
  status: JobStatus;
  centerPosition: THREE.Vector3;
  orbitRadius: number;
  selectedIds: string[];
  hoveredId: string | null;
  onJobClick: (job: Job) => void;
  onJobHover: (job: Job | null) => void;
}

function StatusCluster({
  jobs,
  status,
  centerPosition,
  orbitRadius,
  selectedIds,
  hoveredId,
  onJobClick,
  onJobHover,
}: StatusClusterProps) {
  const groupRef = React.useRef<THREE.Group>(null);

  // Slowly rotate non-running clusters
  useFrame((state) => {
    if (groupRef.current && status !== "running") {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  // Calculate positions in a circular arrangement
  const positions = React.useMemo(() => {
    return jobs.map((_, index) => {
      const angle = (index / Math.max(jobs.length, 1)) * Math.PI * 2;
      const radius = jobs.length === 1 ? 0 : orbitRadius * 0.3;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    });
  }, [jobs.length, orbitRadius]);

  return (
    <group ref={groupRef} position={centerPosition}>
      {jobs.map((job, index) => (
        <JobNode
          key={job.id}
          job={job}
          position={positions[index]}
          isSelected={selectedIds.includes(job.id)}
          isHovered={hoveredId === job.id}
          onClick={() => onJobClick(job)}
          onHover={(hovered) => onJobHover(hovered ? job : null)}
        />
      ))}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Job Cluster Container
// -----------------------------------------------------------------------------

export function JobCluster({
  jobs,
  selectedIds = [],
  hoveredId = null,
  onJobClick,
  onJobHover,
  position = [0, 0, 0],
  onTopologyChange,
}: JobClusterProps) {
  // Group jobs by status
  const jobsByStatus = React.useMemo(() => {
    const grouped: Record<JobStatus, Job[]> = {
      queued: [],
      running: [],
      completed: [],
      blocked: [],
      quarantine: [],
    };

    jobs.forEach((job) => {
      if (grouped[job.status]) {
        grouped[job.status].push(job);
      }
    });

    return grouped;
  }, [jobs]);

  const clusterConfig = React.useMemo<
    Record<JobStatus, { angle: number; distance: number; height: number }>
  >(
    () => ({
      running: { angle: 0, distance: 0, height: 0 }, // Center
      queued: { angle: -Math.PI / 4, distance: 2.5, height: 0.5 },
      completed: { angle: Math.PI / 4, distance: 2.5, height: 0.5 },
      blocked: { angle: -3 * Math.PI / 4, distance: 2.5, height: -0.5 },
      quarantine: { angle: 3 * Math.PI / 4, distance: 2.5, height: -0.5 },
    }),
    []
  );

  const topologySlice = React.useMemo(() => {
    const nodes = (Object.entries(jobsByStatus) as [JobStatus, Job[]][]).flatMap(
      ([status, statusJobs]) => {
        if (statusJobs.length === 0) return [];

        const config = clusterConfig[status];
        const centerPos = new THREE.Vector3(
          Math.cos(config.angle) * config.distance,
          config.height,
          Math.sin(config.angle) * config.distance
        );

        const orbitRadius = 1.5;
        const radiusScale = statusJobs.length === 1 ? 0 : orbitRadius * 0.3;

        return statusJobs.map((job, index) => {
          const angle = (index / Math.max(statusJobs.length, 1)) * Math.PI * 2;
          const localPos = new THREE.Vector3(
            Math.cos(angle) * radiusScale,
            0,
            Math.sin(angle) * radiusScale
          );
          const worldPos = new THREE.Vector3(
            position[0],
            position[1],
            position[2]
          )
            .add(centerPos)
            .add(localPos);

          const visual = JOB_VISUALS[job.status];

          return {
            id: job.id,
            type: "job",
            label: job.type,
            position: [worldPos.x, worldPos.y, worldPos.z] as [number, number, number],
            radius: visual.size ?? 0.3,
            color: visual.color,
            meta: { status: job.status, jobType: job.type },
          };
        });
      }
    );

    return { nodes };
  }, [jobsByStatus, clusterConfig, position]);

  React.useEffect(() => {
    if (!onTopologyChange) return;
    onTopologyChange(topologySlice);
  }, [onTopologyChange, topologySlice]);

  // Memoize connection geometries to avoid creating new BufferGeometry on every render
  const connectionGeometries = React.useMemo(() => {
    const geometries = new Map<string, THREE.BufferGeometry>();

    if (jobsByStatus.running.length === 0) return geometries;

    (["queued", "completed", "blocked", "quarantine"] as JobStatus[]).forEach((status) => {
      if (jobsByStatus[status].length === 0) return;
      const config = clusterConfig[status];
      const endPos = new THREE.Vector3(
        Math.cos(config.angle) * config.distance * 0.8,
        config.height * 0.8,
        Math.sin(config.angle) * config.distance * 0.8
      );
      const points = [new THREE.Vector3(0, 0, 0), endPos];
      geometries.set(status, new THREE.BufferGeometry().setFromPoints(points));
    });

    return geometries;
  }, [jobsByStatus, clusterConfig]);

  return (
    <group position={position}>
      {(Object.entries(jobsByStatus) as [JobStatus, Job[]][]).map(([status, statusJobs]) => {
        if (statusJobs.length === 0) return null;

        const config = clusterConfig[status];
        const centerPos = new THREE.Vector3(
          Math.cos(config.angle) * config.distance,
          config.height,
          Math.sin(config.angle) * config.distance
        );

        return (
          <StatusCluster
            key={status}
            jobs={statusJobs}
            status={status}
            centerPosition={centerPos}
            orbitRadius={1.5}
            selectedIds={selectedIds}
            hoveredId={hoveredId}
            onJobClick={onJobClick || (() => {})}
            onJobHover={onJobHover || (() => {})}
          />
        );
      })}

      {/* Connection lines between running and other clusters */}
      {jobsByStatus.running.length > 0 && (
        <group>
          {(["queued", "completed", "blocked", "quarantine"] as JobStatus[]).map((status) => {
            const lineGeometry = connectionGeometries.get(status);
            if (!lineGeometry) return null;

            return (
              <line key={`line-${status}`}>
                <primitive object={lineGeometry} attach="geometry" />
                <lineBasicMaterial
                  color={JOB_VISUALS[status].color}
                  transparent
                  opacity={0.2}
                />
              </line>
            );
          })}
        </group>
      )}
    </group>
  );
}
