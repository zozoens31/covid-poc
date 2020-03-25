
interface LocationHistory {
  timelineObjects: readonly TimelineObject[]
}

type TimelineObject = PlaceVisitObject | ActivitySegmentObject

interface PlaceVisitObject {
  placeVisit: PlaceVisit
}

interface ActivitySegmentObject {
  activitySegment: ActivitySegment
}

interface PlaceVisit {
  location: Location & {placeId: string}
  duration: Duration
}

interface ActivitySegment {
  startLocation: Location
  endLocation: Location
}

interface Location {
  latitudeE7: number
  longitudeE7: number
  placeId?: string
}

interface Duration {
  endTimestampMs: string
  startTimestampMs: string
}
