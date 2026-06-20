import React from 'react';
import { Text, View } from 'react-native';
import { create } from 'react-test-renderer';
import HeroCard from '../HeroCard';

describe('HeroCard', () => {
  it('renders the label, subtitle, and rounded amount', () => {
    const tree = create(
      <HeroCard label="Ankit" subtitle="Spent this month" amount={1234.6} progressPct={40} />
    ).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(
      expect.arrayContaining([
        'ANKIT',
        'Spent this month',
        expect.stringContaining('1,235'),
      ])
    );
  });

  it('clamps the progress bar fill width to 100%', () => {
    const tree = create(<HeroCard label="Ankit" subtitle="Spent" amount={100} progressPct={150} />).root;
    const fill = tree.findAllByType(View).find((node) => node.props.testID === 'hero-progress-fill')!;
    expect(fill.props.style.width).toBe('100%');
  });

  it('renders footer text when provided', () => {
    const tree = create(
      <HeroCard
        label="Ankit"
        subtitle="Spent"
        amount={100}
        progressPct={10}
        footerLeft="₹900 left"
        footerRight="of ₹1,000"
      />
    ).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(expect.arrayContaining(['₹900 left', 'of ₹1,000']));
  });
});
