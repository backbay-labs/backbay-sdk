'use client';

/**
 * CardinalItem
 *
 * A single item in the cardinal menu (N, E, S, W positions).
 */

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import styled from 'styled-components';

import type { CardinalItemProps } from './types';
import { useSentinelDependencies } from './SentinelProvider';

const ItemContainer = styled(motion.button)`
  width: 56px;
  height: 56px;
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
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(212, 168, 75, 0.9);
  white-space: nowrap;
  pointer-events: none;
`;

export const CardinalItem: React.FC<CardinalItemProps> = ({
  icon,
  label,
  position,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { IconRenderer } = useSentinelDependencies();

  return (
    <ItemContainer
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {IconRenderer && (
        <IconRenderer name={icon} size={24} color="rgba(212, 168, 75, 1)" />
      )}
      <Label
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        {label}
      </Label>
    </ItemContainer>
  );
};

export default CardinalItem;
