import 'core-js/fn/array/flat-map'
import JSZip from 'jszip'
import React, {Suspense, useCallback, useEffect, useState} from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {useDropzone} from 'react-dropzone'

import {CancelablePromise, makeCancelable} from 'store/promise'

import {CircularProgress} from 'components/theme'


const GOOGLE_MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

// TODO(cyrille): Fetch from database at some point.
const placesWithCovidContacts: {[placeId: string]: readonly google.Duration[]} = {
  ChIJtxrD5mPq9EcRvotPVFs0CJc: [{
    endTimestampMs: '1583233357000',
    startTimestampMs: '1583225265000',
  }],
}


const getRelevantMonthsRegex = (originDate: Date): RegExp => {
  const fortnightAgo = new Date(originDate)
  fortnightAgo.setDate(originDate.getDate() - 15)

  const monthChoice = [fortnightAgo, originDate].
    map(date => `${date.getFullYear()}_${GOOGLE_MONTHS[date.getMonth()]}`).
    join('|')
  return new RegExp(`/(${monthChoice})\\.json$`)
}
const isPlaceVisit = (timelineObject: google.TimelineObject):
timelineObject is google.PlaceVisitObject =>
  !!(timelineObject as google.PlaceVisitObject).placeVisit


const getRelevantData = (originDate: Date, fileContents: readonly string[]):
readonly google.PlaceVisit[] => {
  const fortnightAgo = new Date(originDate)
  fortnightAgo.setDate(originDate.getDate() - 15)
  const startDate = fortnightAgo.getTime().toString()
  const endDate = originDate.getTime().toString()
  const fullHistory = fileContents.flatMap(fileContent =>
    (JSON.parse(fileContent) as google.LocationHistory).timelineObjects)
  return fullHistory.flatMap(timelineObject => {
    if (!isPlaceVisit(timelineObject)) {
      return []
    }
    const {duration: {endTimestampMs, startTimestampMs}} = timelineObject.placeVisit
    if (endTimestampMs < startDate || startTimestampMs > endDate) {
      return []
    }
    return [timelineObject.placeVisit]
  })
}


const findAllContacts = (history: readonly google.PlaceVisit[]): CancelablePromise<number> =>
  makeCancelable(
    new Promise(resolve => {
      const contactsFound = history.
        filter(({duration: {endTimestampMs, startTimestampMs}, location: {placeId}}): boolean =>
          (placesWithCovidContacts[placeId] || []).
            some(({endTimestampMs: contactEnd, startTimestampMs: contactStart}): boolean =>
              startTimestampMs <= contactEnd && contactStart < endTimestampMs)).
        length
      resolve(contactsFound)
    }))



const MainApp = (): React.ReactElement => {
  const [locationHistory, setHistoryJson] = useState<readonly google.PlaceVisit[]>([])
  const [isComputing, setComputing] = useState(false)
  const [contacts, setContacts] = useState<undefined|number>(undefined)
  const [date, setDate] = useState(new Date())
  const setMyDate = useCallback(date => setDate(date), [])
  const onDrop = useCallback((files: readonly File[]): void => {
    if (!files.length) {
      return
    }
    const newZip = new JSZip()
    // TODO(cyrille): Recompute if date changes.
    newZip.loadAsync(files[0]).
      then(zipped => Promise.all(
        zipped.file(getRelevantMonthsRegex(date)).map(file => file.async('text')),
      )).
      then(data =>
        getRelevantData(date, data)).
      then(setHistoryJson)
  }, [date])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
  useEffect((): (() => void) => {
    if (!locationHistory.length) {
      return (): void => void 0
    }
    setComputing(true)
    const compute = findAllContacts(locationHistory)
    compute.promise.then(setContacts)
    compute.promise.then((): void => setComputing(false))
    return compute.cancel
  }, [locationHistory])
  const textAreaStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 18,
    height: 300,
    margin: 'auto',
    padding: 20,
    width: '70%',
  }
  const shownHistory = locationHistory.length ? JSON.stringify(locationHistory, undefined, 2) : ''
  return <div style={{padding: 20}}>
    <header>
      <h1>Application de traçage des contact pour le dépistage de SARS-COV-2</h1>
    </header>
    <section>
      <h2>Indiquez la date de vos premiers symtômes</h2>
      <p>
        Cette date nous permettra de nous limiter aux données de localisation des 15 jours
        précédant cette date.
      </p>
      <DatePicker selected={date} onChange={setMyDate} />
    </section>
    <section>
      <h2>Exportez vos données de géo-localisation</h2>
      <p>
        Allez sur la page des <a
          href="https://takeout.google.com/settings/takeout/custom/location_history?pli=1">
          exports de données
        </a> de Google
      </p>
      <p>
        Cliquez sur étape suivante, puis sur commencer l'export (vous pouvez modifier
        les paramètres si vous le souhaitez, en conservant le format JSON).
      </p>
      <p>
        Vous recevrez prochainement un email vous permettant d'accéder aux données.
        En suivant les instructions données par Google, téléchargez le fichier.<br />
      </p>
    </section>
    <section>
      <h2>Comparez vos données aux informations de contamination</h2>
      <div {...getRootProps({style: {
        border: '1px solid #e8eaf0', // MODAL_PROJECT_GREY
        margin: '20px auto',
        maxWidth: 500,
        padding: 50,
      }})}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Déposez votre fichier ici</p> :
            <p>
              Déposez ici le fichier zip téléchargé sur Google Takeout.
              Par exemple&nbsp;: <code>takeout-20200325T105724Z-001.zip</code>.<br />
              L'opération se déroule entièrement sur votre ordinateur, vous pouvez vous déconnecter
              d'internet avant de procéder pour vous en assurer, si vous le souhaitez.
            </p>
        }
      </div>
      <textarea
        value={shownHistory} style={textAreaStyle}
        placeholder="Vos données des 15 derniers jours apparaitront ici" disabled={true} />
      {isComputing ? <CircularProgress /> : typeof contacts === 'undefined' ? locationHistory ?
        <p>
          Une erreur s'est produite, assurez-vous de fournir le bon fichier ZIP.
        </p> : '' : contacts ? <p>
        Vous avez été au moins {contacts} fois dans le même lieu qu'une personne ayant été
        contaminée par le virus SARS-COV-2.
        Si vous présentez des symptômes, appelez votre médecin traitant.
      </p> : <p>
        Nous n'avons pas trouvé de contact SARS-COV-2 à proximité dans votre historique.
      </p>}
    </section>
  </div>
}

const App = (): React.ReactElement => <Suspense fallback="Waiting...">
  <MainApp />
</Suspense>
const AppMemo = React.memo(App)

export {AppMemo as App}
