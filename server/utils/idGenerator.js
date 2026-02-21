/**
 * Generate human-readable emergency ID: EMG-YYYY-NNNNNN
 */
async function generateEmergencyId(EmergencyModel) {
  const year = new Date().getFullYear();
  const prefix = `EMG-${year}-`;
  const last = await EmergencyModel.findOne(
    { emergencyId: new RegExp(`^${prefix}`) },
    { emergencyId: 1 }
  )
    .sort({ emergencyId: -1 })
    .lean();
  let seq = 1;
  if (last && last.emergencyId) {
    const match = last.emergencyId.match(/\d+$/);
    if (match) seq = parseInt(match[0], 10) + 1;
  }
  const num = String(seq).padStart(6, '0');
  return `${prefix}${num}`;
}

async function generateDispatchId(DispatchModel) {
  const year = new Date().getFullYear();
  const c = await DispatchModel.countDocuments({ dispatchId: new RegExp(`^DIS-${year}-`) });
  return `DIS-${year}-${String(c + 1).padStart(5, '0')}`;
}

function generateEvidenceId() {
  const year = new Date().getFullYear();
  const r = Math.floor(Math.random() * 999999) + 1;
  return `EVD-${year}-${String(r).padStart(6, '0')}`;
}

module.exports = { generateEmergencyId, generateDispatchId, generateEvidenceId };
