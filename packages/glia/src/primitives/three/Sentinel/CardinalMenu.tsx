'use client';

/**
 * CardinalMenu
 *
 * The main menu that appears around the Sentinel orb with items
 * positioned along a 180-degree arc (top half only, from left to right).
 */

import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import type { CardinalMenuProps, DocketItem } from './types';
import { useSentinelStore } from './sentinelStore';
import { useSentinelDependencies } from './SentinelProvider';
import { CardinalItem } from './CardinalItem';
import { RadialSubmenu } from './RadialSubmenu';
import { VerticalSubmenu } from './VerticalSubmenu';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const ARC_RADIUS = 120;
// Arc spans from 180 degrees (left) to 0 degrees (right) - top half only
const ARC_START_ANGLE = 180; // degrees - left side
const ARC_END_ANGLE = 0;     // degrees - right side

/**
 * Calculate position for item at index i out of n items across the top 180-degree arc.
 * Arc goes from 180 degrees (left) to 0 degrees (right), distributed evenly.
 */
function calculateArcPosition(
  index: number,
  total: number,
  radius: number = ARC_RADIUS
): { x: number; y: number } {
  // For single item, place at top (90 degrees)
  // For multiple items, distribute evenly from 180 to 0 degrees
  let angleDegrees: number;

  if (total === 1) {
    angleDegrees = 90; // top center
  } else {
    // Distribute from 180 to 0 degrees (left to right across top)
    angleDegrees = ARC_START_ANGLE - (ARC_START_ANGLE - ARC_END_ANGLE) * (index / (total - 1));
  }

  const radians = (angleDegrees * Math.PI) / 180;

  return {
    x: Math.cos(radians) * radius,
    y: -Math.sin(radians) * radius, // negative because screen Y is inverted
  };
}

// -----------------------------------------------------------------------------
// Styled Components
// -----------------------------------------------------------------------------

const MenuContainer = styled(motion.div)`
  position: fixed;
  width: 0;
  height: 0;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9600;
  pointer-events: none;
`;

const ItemWrapper = styled(motion.div)`
  position: absolute;
  pointer-events: auto;
  transform-origin: center;
`;

const ItemPositioner = styled.div`
  transform: translate(-50%, -50%);
`;

const EditLink = styled(motion.a)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 32px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(212, 168, 75, 0.5);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease;
  pointer-events: auto;

  &:hover {
    color: rgba(212, 168, 75, 1);
  }
`;

// -----------------------------------------------------------------------------
// Animation Variants
// -----------------------------------------------------------------------------

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.6,
    transition: {
      duration: 0.15,
    },
  },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const CardinalMenu: React.FC<CardinalMenuProps> = ({
  items: itemsProp,
  onEdit,
}) => {
  const phase = useSentinelStore((s) => s.phase);
  const docket = useSentinelStore((s) => s.docket);
  const dismiss = useSentinelStore((s) => s.dismiss);
  const enterAvatarMode = useSentinelStore((s) => s.enterAvatarMode);
  const expandedCardinal = useSentinelStore((s) => s.expandedCardinal);
  const expandCardinal = useSentinelStore((s) => s.expandCardinal);
  const orbPosition = useSentinelStore((s) => s.orbPosition);

  const { onOpenProcess, processMap } = useSentinelDependencies();

  // Local state for radial hover (for vertical submenu)
  const [hoveredRadialId, setHoveredRadialId] = useState<string | null>(null);
  const [hoveredRadialItem, setHoveredRadialItem] = useState<DocketItem | null>(null);
  const [radialItemPosition, setRadialItemPosition] = useState<{ x: number; y: number } | null>(null);
  // Track which item index is expanded (for arc-based items)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const isVisible = phase === 'open';

  // Use provided items or fall back to docket items with position
  const arcItems = useMemo(() => {
    if (itemsProp && itemsProp.length > 0) {
      return itemsProp;
    }
    // Fallback: use docket items that have a cardinal position
    return docket.filter((item) => item.position !== undefined);
  }, [itemsProp, docket]);

  // Get expanded item (if any) - either by index (new system) or cardinal (legacy)
  const expandedItem = useMemo(() => {
    if (expandedIndex !== null && arcItems[expandedIndex]) {
      return arcItems[expandedIndex];
    }
    if (expandedCardinal) {
      return arcItems.find((item) => item.position === expandedCardinal) || null;
    }
    return null;
  }, [expandedIndex, expandedCardinal, arcItems]);

  const handleItemClick = useCallback(
    (item: DocketItem, index: number) => {
      // If item has children, toggle expansion
      if (item.children && item.children.length > 0) {
        // Check if this item is expanded (by index or cardinal)
        const isCurrentlyExpanded =
          expandedIndex === index ||
          (item.position && expandedCardinal === item.position);

        if (isCurrentlyExpanded) {
          setExpandedIndex(null);
          expandCardinal(null); // Collapse
        } else {
          setExpandedIndex(index);
          if (item.position) {
            expandCardinal(item.position); // For legacy support
          }
        }
        return;
      }

      // Leaf action
      if (item.id === 'avatar') {
        enterAvatarMode();
      } else {
        const processId = processMap?.[item.id];
        if (processId && onOpenProcess) {
          onOpenProcess(processId, {});
        }
        dismiss();
      }
    },
    [expandedIndex, expandedCardinal, expandCardinal, enterAvatarMode, onOpenProcess, processMap, dismiss]
  );

  const handleRadialItemClick = useCallback(
    (radialItem: DocketItem) => {
      // If item has children, we show vertical submenu on hover
      // On click, just execute action if leaf
      if (!radialItem.children || radialItem.children.length === 0) {
        if (radialItem.action) {
          radialItem.action();
        }
        dismiss();
      }
    },
    [dismiss]
  );

  const handleRadialItemHover = useCallback(
    (itemId: string | null) => {
      setHoveredRadialId(itemId);
      if (itemId && expandedItem?.children) {
        const item = expandedItem.children.find((c) => c.id === itemId);
        setHoveredRadialItem(item || null);
        // Calculate position based on orb center + item position on arc
        if (item && expandedIndex !== null) {
          const arcPos = calculateArcPosition(expandedIndex, arcItems.length);
          setRadialItemPosition({
            x: orbPosition.x + arcPos.x,
            y: orbPosition.y + arcPos.y,
          });
        } else if (item && expandedItem.position) {
          // Legacy cardinal fallback
          const cardinalIndex = arcItems.findIndex((i) => i.id === expandedItem.id);
          if (cardinalIndex >= 0) {
            const arcPos = calculateArcPosition(cardinalIndex, arcItems.length);
            setRadialItemPosition({
              x: orbPosition.x + arcPos.x,
              y: orbPosition.y + arcPos.y,
            });
          }
        }
      } else {
        setHoveredRadialItem(null);
        setRadialItemPosition(null);
      }
    },
    [expandedItem, expandedIndex, arcItems, orbPosition]
  );

  const handleVerticalItemClick = useCallback(
    (verticalItem: DocketItem) => {
      if (verticalItem.action) {
        verticalItem.action();
      }
      dismiss();
    },
    [dismiss]
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <MenuContainer
          key="cardinal-menu"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ left: orbPosition.x, top: orbPosition.y }}
        >
          {arcItems.map((item, index) => {
            const offset = calculateArcPosition(index, arcItems.length);
            const isExpanded =
              expandedIndex === index ||
              (item.position && expandedCardinal === item.position);

            return (
              <ItemWrapper
                key={item.id}
                variants={itemVariants}
                style={{
                  left: offset.x,
                  top: offset.y,
                }}
              >
                <ItemPositioner>
                  <CardinalItem
                    icon={item.icon}
                    label={item.label}
                    position={item.position || 'N'}
                    onClick={() => handleItemClick(item, index)}
                  />

                  {/* Radial submenu for expanded item */}
                  {isExpanded && item.children && item.children.length > 0 && (
                    <RadialSubmenu
                      items={item.children}
                      centerOffset={{ x: 0, y: 0 }}
                      arcConstraint="semicircle"
                      onItemClick={handleRadialItemClick}
                      onItemHover={handleRadialItemHover}
                      hoveredItemId={hoveredRadialId}
                    />
                  )}
                </ItemPositioner>
              </ItemWrapper>
            );
          })}

          {/* Edit link below arc center */}
          {onEdit && (
            <EditLink
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.2 }}
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
              role="button"
              tabIndex={0}
            >
              edit
            </EditLink>
          )}

          {/* Vertical submenu for hovered radial item */}
          {hoveredRadialItem?.children && hoveredRadialItem.children.length > 0 && radialItemPosition && (
            <VerticalSubmenu
              items={hoveredRadialItem.children}
              anchorPosition={radialItemPosition}
              onItemClick={handleVerticalItemClick}
            />
          )}
        </MenuContainer>
      )}
    </AnimatePresence>
  );
};

export default CardinalMenu;
