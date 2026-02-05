/**
 * Tests for bb-protocol DOM utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  findAction,
  findAllActions,
  findEntity,
  findAllEntities,
  findField,
  getActionId,
  getEntityType,
  getEntityId,
  getState,
  requiresConfirmation,
  getDescription,
  getInputs,
  getCost,
  extractEntity,
  extractFieldValue,
  extractAllEntities,
  setState,
  getAvailableActions,
  isActionAvailable,
} from '../../src/protocol/dom.js';

describe('DOM utilities', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('findAction', () => {
    it('should find an action element by ID', () => {
      container.innerHTML = `
        <button data-bb-action="add-to-cart">Add</button>
      `;
      const element = findAction('add-to-cart', container);
      expect(element).not.toBeNull();
      expect(element?.textContent).toBe('Add');
    });

    it('should return null for non-existent action', () => {
      const element = findAction('non-existent', container);
      expect(element).toBeNull();
    });
  });

  describe('findAllActions', () => {
    it('should find all elements with a specific action', () => {
      container.innerHTML = `
        <button data-bb-action="remove">Remove 1</button>
        <button data-bb-action="remove">Remove 2</button>
        <button data-bb-action="add">Add</button>
      `;
      const elements = findAllActions('remove', container);
      expect(elements).toHaveLength(2);
    });
  });

  describe('findEntity', () => {
    it('should find an entity by type and ID', () => {
      container.innerHTML = `
        <article data-bb-entity="product" data-bb-entity-id="prod-123">
          <h3>Product</h3>
        </article>
      `;
      const element = findEntity('product', 'prod-123', container);
      expect(element).not.toBeNull();
    });
  });

  describe('findAllEntities', () => {
    it('should find all entities of a type', () => {
      container.innerHTML = `
        <article data-bb-entity="product" data-bb-entity-id="prod-1"></article>
        <article data-bb-entity="product" data-bb-entity-id="prod-2"></article>
        <article data-bb-entity="category" data-bb-entity-id="cat-1"></article>
      `;
      const products = findAllEntities('product', container);
      expect(products).toHaveLength(2);
    });
  });

  describe('attribute reading', () => {
    it('should get action ID', () => {
      container.innerHTML = `<button data-bb-action="submit">Submit</button>`;
      const element = container.querySelector('button')!;
      expect(getActionId(element)).toBe('submit');
    });

    it('should get entity type and ID', () => {
      container.innerHTML = `
        <div data-bb-entity="product" data-bb-entity-id="abc-123"></div>
      `;
      const element = container.querySelector('div')!;
      expect(getEntityType(element)).toBe('product');
      expect(getEntityId(element)).toBe('abc-123');
    });

    it('should get state', () => {
      container.innerHTML = `<button data-bb-state="loading">Loading...</button>`;
      const element = container.querySelector('button')!;
      expect(getState(element)).toBe('loading');
    });

    it('should check confirmation requirement', () => {
      container.innerHTML = `
        <button data-bb-confirm="true">Delete</button>
        <button data-bb-confirm="false">Save</button>
        <button>Cancel</button>
      `;
      const buttons = container.querySelectorAll('button');
      expect(requiresConfirmation(buttons[0])).toBe(true);
      expect(requiresConfirmation(buttons[1])).toBe(false);
      expect(requiresConfirmation(buttons[2])).toBe(false);
    });

    it('should get description from attribute', () => {
      container.innerHTML = `
        <button data-bb-description="Click to submit the form">Submit</button>
      `;
      const element = container.querySelector('button')!;
      expect(getDescription(element)).toBe('Click to submit the form');
    });

    it('should get description from child element', () => {
      container.innerHTML = `
        <button>
          <span data-bb-description>Hidden description text</span>
          Submit
        </button>
      `;
      const element = container.querySelector('button')!;
      expect(getDescription(element)).toBe('Hidden description text');
    });

    it('should parse JSON inputs', () => {
      container.innerHTML = `
        <button data-bb-inputs='{"productId": "123", "quantity": 2}'>Add</button>
      `;
      const element = container.querySelector('button')!;
      const inputs = getInputs(element);
      expect(inputs).toEqual({ productId: '123', quantity: 2 });
    });

    it('should parse JSON cost', () => {
      container.innerHTML = `
        <button data-bb-cost='{"usd": 9.99, "risk": "low"}'>Buy</button>
      `;
      const element = container.querySelector('button')!;
      const cost = getCost(element);
      expect(cost).toEqual({ usd: 9.99, risk: 'low' });
    });
  });

  describe('entity extraction', () => {
    beforeEach(() => {
      container.innerHTML = `
        <article data-bb-entity="product" data-bb-entity-id="prod-456">
          <h3 data-bb-field="name">Blue Widget</h3>
          <span data-bb-field="price">29.99</span>
          <img data-bb-field="image" src="/widget.jpg" alt="Widget">
          <span data-bb-field="status" data-bb-state="in-stock">In Stock</span>
        </article>
      `;
    });

    it('should extract field value from text content', () => {
      const article = container.querySelector('article')!;
      const value = extractFieldValue(article, '[data-bb-field="name"]');
      expect(value).toBe('Blue Widget');
    });

    it('should extract field value from data attribute', () => {
      const article = container.querySelector('article')!;
      const value = extractFieldValue(article, 'data-bb-entity-id');
      expect(value).toBe('prod-456');
    });

    it('should extract field value from element attribute', () => {
      const article = container.querySelector('article')!;
      const value = extractFieldValue(article, '[data-bb-field="image"] @src');
      expect(value).toBe('/widget.jpg');
    });

    it('should extract field value from data attribute on child', () => {
      const article = container.querySelector('article')!;
      const value = extractFieldValue(article, '[data-bb-field="status"] @data-bb-state');
      expect(value).toBe('in-stock');
    });

    it('should extract full entity based on schema', () => {
      const article = container.querySelector('article')!;
      const schema = {
        selector: '[data-bb-entity="product"]',
        fields: {
          id: 'data-bb-entity-id',
          name: '[data-bb-field="name"]',
          price: '[data-bb-field="price"]',
          image: '[data-bb-field="image"] @src',
        },
      };
      const entity = extractEntity(article, schema);
      expect(entity).toEqual({
        id: 'prod-456',
        name: 'Blue Widget',
        price: '29.99',
        image: '/widget.jpg',
      });
    });

    it('should extract all entities', () => {
      container.innerHTML = `
        <article data-bb-entity="product" data-bb-entity-id="prod-1">
          <h3 data-bb-field="name">Product 1</h3>
        </article>
        <article data-bb-entity="product" data-bb-entity-id="prod-2">
          <h3 data-bb-field="name">Product 2</h3>
        </article>
      `;
      const schema = {
        selector: '[data-bb-entity="product"]',
        fields: {
          id: 'data-bb-entity-id',
          name: '[data-bb-field="name"]',
        },
      };
      const entities = extractAllEntities('product', schema, container);
      expect(entities).toHaveLength(2);
      expect(entities[0].id).toBe('prod-1');
      expect(entities[1].id).toBe('prod-2');
    });
  });

  describe('state management', () => {
    it('should set state on element', () => {
      container.innerHTML = `<button>Click</button>`;
      const button = container.querySelector('button')!;
      setState(button, 'loading');
      expect(button.getAttribute('data-bb-state')).toBe('loading');
    });
  });

  describe('action helpers', () => {
    it('should get all available actions with metadata', () => {
      container.innerHTML = `
        <button
          data-bb-action="buy"
          data-bb-state="idle"
          data-bb-confirm="true"
          data-bb-description="Purchase this item"
          data-bb-inputs='{"productId": "123"}'
          data-bb-cost='{"usd": 9.99, "risk": "high"}'
        >
          Buy Now
        </button>
        <button data-bb-action="cancel" data-bb-state="disabled">Cancel</button>
      `;

      const actions = getAvailableActions(container);
      expect(actions).toHaveLength(2);

      const buyAction = actions.find((a) => a.id === 'buy')!;
      expect(buyAction.state).toBe('idle');
      expect(buyAction.requiresConfirmation).toBe(true);
      expect(buyAction.description).toBe('Purchase this item');
      expect(buyAction.inputs).toEqual({ productId: '123' });
      expect(buyAction.cost).toEqual({ usd: 9.99, risk: 'high' });
    });

    it('should check if action is available', () => {
      container.innerHTML = `
        <button data-bb-action="a" data-bb-state="idle">A</button>
        <button data-bb-action="b" data-bb-state="loading">B</button>
        <button data-bb-action="c" data-bb-state="disabled">C</button>
        <button data-bb-action="d">D</button>
      `;

      const buttons = container.querySelectorAll('button');
      expect(isActionAvailable(buttons[0])).toBe(true); // idle
      expect(isActionAvailable(buttons[1])).toBe(false); // loading
      expect(isActionAvailable(buttons[2])).toBe(false); // disabled
      expect(isActionAvailable(buttons[3])).toBe(true); // no state = available
    });
  });
});
