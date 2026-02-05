'use client';

/**
 * RadialSubmenu
 *
 * A radial menu that appears around a cardinal direction item
 * when it is expanded. Items are distributed along an arc.
 */

import { AnimatePresence, motion, Variants } from 'motion/react';
import React from 'react';
import styled from 'styled-components';

import type { ArcConstraint, RadialSubmenuProps, SubmenuItem } from './types';
import { useSentinelDependencies } from './SentinelProvider';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const ORBIT_RADIUS = 70;
const ITEM_SIZE = 44;
const MAX_ITEMS = 8;

/**
 * Determine the arc range based on the parent offset and constraint.
 * Returns [startAngle, endAngle] in degrees.
 *
 * When arcConstraint is 'semicircle', items are placed in the top half only
 * (180 degrees from left to right).
 */
function getArcRangeFromOffset(
  offset: { x: number; y: number },
  arcConstraint: ArcConstraint = 'auto'
): [number, number] {
  // For semicircle constraint, always use top 180-degree arc
  if (arcConstraint === 'semicircle') {
    // Arc from 180 degrees (left) to 0 degrees (right) in screen coords
    // This places items in the top half
    return [180, 360]; // In standard math coords, then we negate Y
  }

  const { x, y } = offset;

  // North: parent is above center (y < 0)
  if (y < 0 && Math.abs(x) < Math.abs(y)) {
    return [-90, 90]; // left to right arc
  }
  // East: parent is to the right (x > 0)
  if (x > 0 && Math.abs(x) >= Math.abs(y)) {
    return [0, 180]; // top to bottom arc
  }
  // South: parent is below center (y > 0)
  if (y > 0 && Math.abs(x) < Math.abs(y)) {
    return [90, 270]; // right to left arc
  }
  // West: parent is to the left (x < 0)
  if (x < 0 && Math.abs(x) >= Math.abs(y)) {
    return [180, 360]; // bottom to top arc
  }

  // Default to North arc
  return [-90, 90];
}

/**
 * Calculate position for item at index i out of n items across the arc.
 * For semicircle constraint, positions are in the top half with Y inverted for screen coords.
 */
function calculateItemPosition(
  index: number,
  total: number,
  arcRange: [number, number],
  arcConstraint: ArcConstraint = 'auto'
): { x: number; y: number } {
  const [startAngle, endAngle] = arcRange;

  // Distribute items evenly across the arc
  const angle = total === 1
    ? (startAngle + endAngle) / 2
    : startAngle + (endAngle - startAngle) * (index / (total - 1));

  const radians = (angle * Math.PI) / 180;

  // For semicircle constraint, we want items in the top half (negative Y in screen coords)
  if (arcConstraint === 'semicircle') {
    return {
      x: Math.cos(radians) * ORBIT_RADIUS,
      y: -Math.abs(Math.sin(radians)) * ORBIT_RADIUS, // Always negative (up)
    };
  }

  return {
    x: Math.cos(radians) * ORBIT_RADIUS,
    y: Math.sin(radians) * ORBIT_RADIUS,
  };
}

// -----------------------------------------------------------------------------
// Styled Components
// -----------------------------------------------------------------------------

const SubmenuContainer = styled(motion.div)`
  position: absolute;
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

const SubmenuButton = styled(motion.button)`
  width: ${ITEM_SIZE}px;
  height: ${ITEM_SIZE}px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(212, 168, 75, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  outline: none;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: rgba(212, 168, 75, 0.1);
    border-color: rgba(212, 168, 75, 0.7);
  }
`;

const Label = styled(motion.span)`
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(212, 168, 75, 0.9);
  white-space: nowrap;
  pointer-events: none;
`;

// -----------------------------------------------------------------------------
// Animation Variants
// -----------------------------------------------------------------------------

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: {
      duration: 0.12,
    },
  },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const RadialSubmenu: React.FC<RadialSubmenuProps> = ({
  items,
  centerOffset,
  arcConstraint = 'auto',
  onItemClick,
  onItemHover,
  hoveredItemId,
}) => {
  const { IconRenderer } = useSentinelDependencies();
  const displayItems = items.slice(0, MAX_ITEMS);
  const arcRange = getArcRangeFromOffset(centerOffset, arcConstraint);

  return (
    <AnimatePresence>
      <SubmenuContainer
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          left: centerOffset.x,
          top: centerOffset.y,
        }}
      >
        {displayItems.map((item, index) => {
          const position = calculateItemPosition(index, displayItems.length, arcRange, arcConstraint);
          const isHovered = hoveredItemId === item.id;

          return (
            <ItemWrapper
              key={item.id}
              variants={itemVariants}
              style={{
                left: position.x,
                top: position.y,
              }}
            >
              <ItemPositioner>
                <SubmenuButton
                  whileHover={{ scale: 1.1 }}
                  onClick={() => onItemClick(item)}
                  onMouseEnter={() => onItemHover(item.id)}
                  onMouseLeave={() => onItemHover(null)}
                >
                  {IconRenderer && (
                    <IconRenderer
                      name={item.icon}
                      size={18}
                      color="rgba(212, 168, 75, 1)"
                    />
                  )}
                  <Label
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </Label>
                </SubmenuButton>
              </ItemPositioner>
            </ItemWrapper>
          );
        })}
      </SubmenuContainer>
    </AnimatePresence>
  );
};

export default RadialSubmenu;
