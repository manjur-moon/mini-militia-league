# Accessibility Review

## Automated

The axe-core suite checks critical and serious violations for:

- Empty states and action controls
- Notification actions
- AI insight content and labeling

Route-guard tests also verify readable loading, inactive and unauthorized states.

## Manual review required

- [ ] Navigate all public and dashboard pages using keyboard only.
- [ ] Focus indicator is visible in light and dark themes.
- [ ] Mobile drawer traps no focus and closes predictably.
- [ ] Every input has a programmatic label.
- [ ] Validation messages identify the related field.
- [ ] Dialogs and destructive actions receive clear accessible names.
- [ ] Tables remain understandable when horizontally scrolled.
- [ ] Charts include textual summaries and do not rely on color alone.
- [ ] Images have meaningful alt text or are marked decorative.
- [ ] Test at 200% browser zoom without loss of content or functionality.
- [ ] Review contrast with a real browser tool; jsdom cannot reliably calculate color contrast.
