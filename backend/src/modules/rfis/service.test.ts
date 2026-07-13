import { RfiStatus } from '@prisma/client';
import { ageInDays, ageingBucket, isOverdue, canTransition } from './service';

describe('RFI Service helper functions', () => {
  describe('ageInDays', () => {
    it('returns 0 for identical dates', () => {
      const now = new Date('2026-07-13T12:00:00Z');
      expect(ageInDays(now, now)).toBe(0);
    });

    it('returns positive whole days floored', () => {
      const from = new Date('2026-07-10T12:00:00Z');
      const now = new Date('2026-07-13T18:00:00Z'); // 3.25 days
      expect(ageInDays(from, now)).toBe(3);
    });

    it('returns 0 for dates in the future', () => {
      const from = new Date('2026-07-15T12:00:00Z');
      const now = new Date('2026-07-13T12:00:00Z');
      expect(ageInDays(from, now)).toBe(0);
    });
  });

  describe('ageingBucket', () => {
    it('categorizes 0-7 days', () => {
      expect(ageingBucket(0)).toBe('0-7');
      expect(ageingBucket(5)).toBe('0-7');
      expect(ageingBucket(7)).toBe('0-7');
    });

    it('categorizes 8-14 days', () => {
      expect(ageingBucket(8)).toBe('8-14');
      expect(ageingBucket(12)).toBe('8-14');
      expect(ageingBucket(14)).toBe('8-14');
    });

    it('categorizes 15-30 days', () => {
      expect(ageingBucket(15)).toBe('15-30');
      expect(ageingBucket(25)).toBe('15-30');
      expect(ageingBucket(30)).toBe('15-30');
    });

    it('categorizes 30+ days', () => {
      expect(ageingBucket(31)).toBe('30+');
      expect(ageingBucket(100)).toBe('30+');
    });
  });

  describe('isOverdue', () => {
    it('returns false when no due date exists', () => {
      expect(isOverdue({ dueDate: null, status: RfiStatus.OPEN })).toBe(false);
    });

    it('returns false when due date is in the future', () => {
      const dueDate = new Date('2026-07-15T00:00:00Z');
      const now = new Date('2026-07-13T00:00:00Z');
      expect(isOverdue({ dueDate, status: RfiStatus.OPEN }, now)).toBe(false);
    });

    it('returns true when due date is in the past and unresolved', () => {
      const dueDate = new Date('2026-07-10T00:00:00Z');
      const now = new Date('2026-07-13T00:00:00Z');
      expect(isOverdue({ dueDate, status: RfiStatus.OPEN }, now)).toBe(true);
      expect(isOverdue({ dueDate, status: RfiStatus.IN_REVIEW }, now)).toBe(true);
    });

    it('returns false when due date is in the past but RFI is resolved', () => {
      const dueDate = new Date('2026-07-10T00:00:00Z');
      const now = new Date('2026-07-13T00:00:00Z');
      expect(isOverdue({ dueDate, status: RfiStatus.ANSWERED }, now)).toBe(false);
      expect(isOverdue({ dueDate, status: RfiStatus.CLOSED }, now)).toBe(false);
      expect(isOverdue({ dueDate, status: RfiStatus.VOID }, now)).toBe(false);
    });
  });

  describe('canTransition', () => {
    it('allows transitions to self (no-op)', () => {
      expect(canTransition(RfiStatus.OPEN, RfiStatus.OPEN)).toBe(true);
      expect(canTransition(RfiStatus.ANSWERED, RfiStatus.ANSWERED)).toBe(true);
    });

    it('allows valid transitions', () => {
      expect(canTransition(RfiStatus.OPEN, RfiStatus.IN_REVIEW)).toBe(true);
      expect(canTransition(RfiStatus.OPEN, RfiStatus.ANSWERED)).toBe(true);
      expect(canTransition(RfiStatus.OPEN, RfiStatus.VOID)).toBe(true);

      expect(canTransition(RfiStatus.IN_REVIEW, RfiStatus.ANSWERED)).toBe(true);
      expect(canTransition(RfiStatus.ANSWERED, RfiStatus.CLOSED)).toBe(true);
    });

    it('disallows invalid transitions', () => {
      expect(canTransition(RfiStatus.OPEN, RfiStatus.CLOSED)).toBe(false);
      expect(canTransition(RfiStatus.CLOSED, RfiStatus.OPEN)).toBe(false);
      expect(canTransition(RfiStatus.VOID, RfiStatus.OPEN)).toBe(false);
    });
  });
});
