function calculate(session, newLocation) {
  let score = 30;

  if (session.contextType === 'physical_attack') score += 30;
  else if (session.contextType === 'forced_vehicle') score += 25;
  else if (session.contextType === 'medical') score += 10;
  else if (session.contextType === 'unsafe') score += 15;

  const { speed, direction, audioLevel } = newLocation;
  const locations = session.locations;

  if (locations.length >= 1) {
    const prev = locations[locations.length - 1];
    if (speed > 50) score += 5;
    if (Math.abs(speed - (prev.speed || 0)) > 15) score += 20;
    if (Math.abs(direction - (prev.direction || 0)) > 60) score += 15;
  }

  if (audioLevel > 70) score += 20;
  if (session.tamperDetected) score += 30;

  score = Math.min(100, Math.max(0, score));

  let riskLevel = 'MODERATE';
  if (score >= 70) riskLevel = 'CRITICAL';
  else if (score >= 40) riskLevel = 'HIGH';

  return { riskScore: score, riskLevel };
}

module.exports = { calculate };
