'use client';

/**
 * VerticalSubmenu
 *
 * A vertical dropdown submenu that appears when hovering over a radial submenu item
 * that has children. Supports scrolling for many items.
 */

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import type { VerticalSubmenuProps, SubmenuItem } from './types';
import { useSentinelDependencies } from './SentinelProvider';

const ITEM_HEIGHT = 36;
const MAX_VISIBLE_ITEMS = 6;
const MENU_WIDTH = 160;
const PADDING_Y = 4;

const Container = styled(motion.div)<{ $openUpward: boolean }>`
  position: fixed;
  width: ${MENU_WIDTH}px;
  max-height: ${ITEM_HEIGHT * MAX_VISIBLE_ITEMS + PADDING_Y * 2}px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 168, 75, 0.25);
  border-radius: 8px;
  padding: ${PADDING_Y}px 0;
  transform-origin: ${({ $openUpward }: { $openUpward: boolean }) => ($openUpward ? 'bottom center' : 'top center')};
  z-index: 10000;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(212, 168, 75, 0.3);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 168, 75, 0.5);
  }
`;

const ItemRow = styled(motion.button)`
  width: 100%;
  height: ${ITEM_HEIGHT}px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  outline: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(212, 168, 75, 0.1);
  }

  &:hover {
    background: rgba(212, 168, 75, 0.1);
    border-left-color: rgba(212, 168, 75, 0.9);
  }
`;

const ItemLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(212, 168, 75, 0.9);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const VerticalSubmenu: React.FC<VerticalSubmenuProps> = ({
  items,
  anchorPosition,
  onItemClick,
}) => {
  const [openUpward, setOpenUpward] = useState(false);
  const { IconRenderer } = useSentinelDependencies();

  useEffect(() => {
    const menuHeight = Math.min(items.length, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT + PADDING_Y * 2;
    const spaceBelow = typeof window !== 'undefined'
      ? window.innerHeight - anchorPosition.y
      : 600 - anchorPosition.y;
    setOpenUpward(spaceBelow < menuHeight + 20);
  }, [anchorPosition.y, items.length]);

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

  const style: React.CSSProperties = {
    left: anchorPosition.x - MENU_WIDTH / 2,
    ...(openUpward
      ? { bottom: windowHeight - anchorPosition.y }
      : { top: anchorPosition.y }),
  };

  return (
    <Container
      $openUpward={openUpward}
      style={style}
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      exit={{ scaleY: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {items.map((item, index) => (
        <ItemRow
          key={item.id}
          onClick={() => {
            item.action?.();
            onItemClick(item);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.03, duration: 0.15 }}
        >
          {IconRenderer && (
            <IconRenderer
              name={item.icon}
              size={16}
              color="rgba(212, 168, 75, 0.9)"
            />
          )}
          <ItemLabel>{item.label}</ItemLabel>
        </ItemRow>
      ))}
    </Container>
  );
};

export default VerticalSubmenu;
