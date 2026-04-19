const CHARITY_IMPACT: Record<string, (amount: number) => string> = {
  'Against Malaria Foundation': (amt) =>
    `$${amt} protects ${Math.max(1, amt * 2)} children from malaria for a month`,
  'GiveDirectly': (amt) =>
    `$${amt} goes directly into the hands of a family living in extreme poverty`,
  'Malaria No More': (amt) =>
    `$${amt} helps fund malaria prevention for ${Math.max(1, amt)} families`,
  'Save the Children': (amt) =>
    `$${amt} helps provide essentials for ${Math.max(1, Math.floor(amt / 5))} child${amt >= 10 ? 'ren' : ''} in need`,
};

const DEFAULT_IMPACT = (amt: number) =>
  `$${amt} is going to make a real difference for someone today`;

export function getCharityImpactMessage(charityName: string | null | undefined, amount: number): string {
  if (!charityName) return DEFAULT_IMPACT(amount);
  const fn = CHARITY_IMPACT[charityName];
  return fn ? fn(amount) : DEFAULT_IMPACT(amount);
}
