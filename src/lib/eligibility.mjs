/** Height rules are screening conditions, never permission to board an attraction. */

export function isKnownHeight (value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function isCurrentAttraction (attraction) {
  return (attraction.status || attraction.s || 'open') === 'open'
}

/** Shared build contract for the standalone browser tools. Zero is a verified no-minimum rule. */
export function eligibilityPayload (attraction) {
  return {
    h: isKnownHeight(attraction.heightIn) ? attraction.heightIn : null,
    s: attraction.status || 'open',
    max: isKnownHeight(attraction.heightMaxIn) ? attraction.heightMaxIn : null,
    accompaniedBelow: isKnownHeight(attraction.accompaniedBelowIn) ? attraction.accompaniedBelowIn : null,
    restrictions: Array.isArray(attraction.riderRestrictions)
      ? attraction.riderRestrictions.slice()
      : (attraction.heightNote ? [attraction.heightNote] : []),
    note: attraction.heightNote || null,
  }
}

/** Absent confirmations keep independently verified conditions out of cleared totals. */
export function heightStatus (heightIn, rideOrMinimum, { accompanied = false, restrictionsConfirmed = false } = {}) {
  const ride = typeof rideOrMinimum === 'object' && rideOrMinimum !== null
    ? rideOrMinimum
    : { h: rideOrMinimum }
  if (!isCurrentAttraction(ride)) return 'closed'
  const minimum = 'heightIn' in ride ? ride.heightIn : ride.h
  if (!isKnownHeight(minimum) || !isKnownHeight(heightIn)) return 'unknown'
  const maximum = 'heightMaxIn' in ride ? ride.heightMaxIn : ride.max
  if (isKnownHeight(maximum) && heightIn > maximum) return 'over'
  if (heightIn < minimum) return minimum - heightIn <= 2 ? 'near' : 'later'
  const accompaniedBelow = 'accompaniedBelowIn' in ride ? ride.accompaniedBelowIn : ride.accompaniedBelow
  if (isKnownHeight(accompaniedBelow) && heightIn < accompaniedBelow && !accompanied) return 'companion'
  const restrictions = Array.isArray(ride.riderRestrictions) ? ride.riderRestrictions
    : Array.isArray(ride.restrictions) ? ride.restrictions : (ride.heightNote ? [ride.heightNote] : [])
  if (restrictions.length && !restrictionsConfirmed) return 'review'
  return 'now'
}
