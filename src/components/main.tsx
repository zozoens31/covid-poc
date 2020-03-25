import JSZip from 'jszip'
import React, {Suspense, useCallback, useEffect, useState} from 'react'
import {useDropzone} from 'react-dropzone'

import {CancelablePromise, makeCancelable} from 'store/promise'

import {CircularProgress} from 'components/theme'


// TODO(cyrille): Fetch from database at some point.
const placesWithCovidContacts: {[placeId: string]: readonly Duration[]} = {
  ChIJtxrD5mPq9EcRvotPVFs0CJc: [{
    endTimestampMs: '1583233357000',
    startTimestampMs: '1583225265000',
  }],
}

const getFortnightAgoTimestampMs = (originDate: Date): string => {
  const date = new Date(originDate)
  date.setDate(date.getDate() - 15)
  return date.getTime().toString()
}
// TODO(cyrille): Use user-input date, from start of symptoms.
const fortnightAgo = getFortnightAgoTimestampMs(new Date('2020-03-14'))


const isPlaceVisit = (timelineObject: TimelineObject): timelineObject is PlaceVisitObject =>
  !!(timelineObject as PlaceVisitObject).placeVisit


const findAllContacts = (history: LocationHistory): CancelablePromise<number> => makeCancelable(
  new Promise(resolve => {
    const contactsFound = history.timelineObjects.
      filter((timelineObject) => {
        if (!isPlaceVisit(timelineObject)) {
          return false
        }
        const {duration: {endTimestampMs, startTimestampMs},
          location: {placeId}} = timelineObject.placeVisit
        if (endTimestampMs < fortnightAgo) {
          return false
        }
        return (placesWithCovidContacts[placeId] || []).
          some(({endTimestampMs: contactEnd, startTimestampMs: contactStart}): boolean =>
            startTimestampMs <= contactEnd && contactStart < endTimestampMs)
      }).length
    resolve(contactsFound)
  }))



const MainApp = (): React.ReactElement => {
  const [locationHistoryJson, setHistoryJson] = useState('')
  const [isComputing, setComputing] = useState(false)
  const [contacts, setContacts] = useState<undefined|number>(undefined)
  const onDrop = useCallback((files: readonly File[]): void => {
    if (!files.length) {
      return
    }
    const newZip = new JSZip()
    newZip.loadAsync(files[0]).
      then(zipped => zipped.file(/2020\/2020_MARCH\.json$/)[0].async('text')).
      then(setHistoryJson)
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
  useEffect((): (() => void) => {
    if (!locationHistoryJson) {
      return (): void => void 0
    }
    let history: LocationHistory
    try {
      history = JSON.parse(locationHistoryJson)
    } catch (error) {
      setContacts(undefined)
      return (): void => void 0
    }
    setComputing(true)
    const compute = findAllContacts(history)
    compute.promise.then(setContacts)
    compute.promise.then((): void => setComputing(false))
    return compute.cancel
  }, [locationHistoryJson])
  const textAreaStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 18,
    height: 300,
    margin: 'auto',
    padding: 20,
    width: '70%',
  }
  return <div style={{padding: 20}}>
    <header>
      <h1>Application de traçage des contact pour le dépistage de SARS-COV-2</h1>
    </header>
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
        style={textAreaStyle} disabled={true} value={locationHistoryJson}
        placeholder="Vos données de mars apparaitront ici" />
      {isComputing ? <CircularProgress /> : typeof contacts === 'undefined' ? locationHistoryJson ?
        <p>
          Une erreur s'est produite, nous n'avons pas réussi à lire vos données.
          Veuillez recopier le contenu du fichier JSON en veillant bien à tout sélectionner.
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
