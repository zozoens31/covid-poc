// Imported from https://github.com/rajeshnaroth/react-cancelable-promise-hook/blob/master/index.js
export interface CancelablePromise<T> {
  cancel: () => void
  promise: Promise<T>
}

const makeCancelable = <T>(promise: Promise<T>): CancelablePromise<T> => {
  let isCanceled = false

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(value => {
      if (!isCanceled) {
        resolve(value)
      }
    }).catch(error => {
      if (!isCanceled) {
        reject(error)
      }
    })
  })

  return {
    cancel: (): void => {
      isCanceled = true
    },
    promise: wrappedPromise,
  }
}

export {makeCancelable}
