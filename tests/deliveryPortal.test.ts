import { expect, test } from 'bun:test';
import { isDeliveryFinished } from '../src/utils/deliveryPortal';

test('admin completed deliveries are finished and stay outside active deliveries', () => {
  expect(isDeliveryFinished('completed')).toBe(true);
});

test('driver delivered orders are finished', () => {
  expect(isDeliveryFinished('delivered')).toBe(true);
});

test('ready and out-for-delivery orders still need delivery', () => {
  expect(isDeliveryFinished('ready')).toBe(false);
  expect(isDeliveryFinished('out-for-delivery')).toBe(false);
});