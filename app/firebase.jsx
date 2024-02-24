import { initializeApp } from 'firebase/app'
import {
	getFirestore,
	doc,
	setDoc,
	collection,
	addDoc,
	getDoc,
	onSnapshot,
	query,
	where,
	getDocs,
	orderBy,
	writeBatch,
	limit,
} from 'firebase/firestore'

// Please replace the following with your Firebase project's configuration
// TODO: move to .env
const firebaseConfig = {
	apiKey: 'AIzaSyC92d2V2tFuaTWQlV03HMveuEIxj9vfRC0',
	authDomain: 'angelic-gift-320720.firebaseapp.com',
	projectId: 'angelic-gift-320720',
	storageBucket: 'angelic-gift-320720.appspot.com',
	messagingSenderId: '898052898988',
	appId: '1:898052898988:web:016a83934a32df087cdf09',
	measurementId: 'G-G5RTHEM8YL',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

export function writeDoc ({ collection_name, data, id = '', isMerge = true }) {
	if (id === '') {
		addDoc(collection(db, collection_name), data)
			.then(docRef => {
				console.log('Document written with ID: ', docRef.id)
			})
			.catch(error => {
				console.error('Error adding document: ', error)
			})
		return
	}

	const collectionRef = doc(db, collection_name, id)

	setDoc(collectionRef, data, { merge: isMerge })
		.then(() => {
			console.log('Document successfully written!')
		})
		.catch(error => {
			console.error('Error writing document: ', error)
		})
}

export function writeDocs ({ collection_name, data, isMerge = true }) {
	const collectionRef = collection(db, collection_name)

	data.forEach(dataObject => {
		addDoc(collectionRef, dataObject)
			.then(docRef => {
				console.log(`Document written with ID: ${docRef.id}`)
			})
			.catch(error => {
				console.error('Error adding document:', error)
			})
	})
}

export function fetchDoc ({ collection, id }) {
	const doc = doc(db, collection, id)

	doc
		.then(docSnap => {
			if (docSnap.exists()) {
				return docSnap.data()
			} else {
				console.log('No such document!')
			}
		})
		.catch(error => {
			console.error('Error getting document:', error)
		})
}

export async function fetchDocs ({ collection_name, conditions = '', orderBy = null, limit = null }) {
	const collectionRef = collection(db, collection_name)
	const conditionsArray = conditions.split(';').filter(condition => condition.trim() !== '')

	const queryConstraints = conditionsArray.map(condition => {
		const [field, operator, value] = condition.split(' ').map(part => part.trim())
		return where(field, operator, value)
	})

	if (orderBy !== null) {
		const [field, direction] = orderBy.split(' ').map(part => part.trim())
		queryConstraints.push(orderBy(field, direction))
	}

	if (limit !== null) {
		queryConstraints.push(limit(limit))
	}

	const q = query(collectionRef, ...queryConstraints)

	
	const res = await getDocs(q)
		.then(querySnapshot => {
			let documents = []

			querySnapshot.forEach(doc => {
				documents.push({
					id: doc.id,
					...doc.data(),
				})
			})

			console.log('Documents:', documents)

			return documents
		})
		.catch(error => {
			console.error('Error getting documents:', error)
		})
	
	return res
}
