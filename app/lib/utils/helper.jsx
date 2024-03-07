import { writeDoc, fetchDoc } from '../../firebase'
import { createShapeId } from '@tldraw/tldraw'

// Save data on the current page to Firebase, the default data_id is 'cur' for the latest global data
export const saveShapesOnCurPage = (editor, data_id = "cur") => {
	const page = editor.getCurrentPageShapes()
	const shapes = JSON.stringify(page)
	writeDoc({ collection_name: 'data', id: data_id, data: { shapes: shapes } })
}

// Fetch the global data from Firebase, the default data_id is 'cur' for the latest global data, set idea_only is true if you only want to fetch the idea nodes
export const fetchSavedShapes = async ({ data_id = "cur", idea_only = false }) => {
	let data = await fetchDoc({ collection: 'data', id: data_id })
	let shapes = JSON.parse(data.shapes)
	if (idea_only) {
		shapes = shapes.filter(shape => shape.type === 'node')
		return shapes
	}
	return shapes
}

export const getNodes = (shapes, nodes = []) => {
	shapes.forEach(shape => {
		if (shape.type === 'node') {
			nodes.push(shape)
		} else if (shape.type === 'new_frame') {
			const children = editor
				.getSortedChildIdsForParent(shape.id)
				.map(id => editor.getShape(id))
			getNodes(children, nodes)
		}
	})
	return nodes
}

export function createArrowBetweenShapes({
	editor,
	relationship,
}) {
	console.log('relationship: ', relationship)

	let ids = []

	relationship.forEach((rel) => {
		const srcId = rel.srcId
		const dstId = rel.dstId
		const srcShape = editor.getShape(srcId)
		const dstShape = editor.getShape(dstId)
		const text = rel.relation

		if (!srcShape || !dstShape) {
			return
		}

		const srcBounds = editor.getShapePageBounds(srcShape)
		const dstBounds = editor.getShapePageBounds(dstShape)

		const srcX = srcBounds.x + srcBounds.width / 2
		const srcY = srcBounds.y + srcBounds.height / 2
		const dstX = dstBounds.x + dstBounds.width / 2
		const dstY = dstBounds.y + dstBounds.height / 2

		const normalizedSrcAnchor = {
			x: 0,
			y: 0.5,
		}

		const normalizedDstAnchor = {
			x: 0,
			y: 0.5,
		}

		// // If an arrow already exists between nodes, update it
		const existingArrow = editor.getCurrentPageShapes().find(
			(s) =>
				s.type === 'arrow' &&
				s.props.start.boundShapeId === srcId &&
				s.props.end.boundShapeId === dstId
		)

		if (existingArrow) {
			editor.updateShape({
				id: existingArrow.id,
				props: {
					text: text,
				},
			})
			return
		}

		// If the reverse arrow already exists, delete it
		const existingReverseArrow = editor.getCurrentPageShapes().find(
			(s) =>
				s.type === 'arrow' &&
				s.props.start.boundShapeId === dstId &&
				s.props.end.boundShapeId === srcId
		)

		if (existingReverseArrow) {
			editor.deleteShape(existingReverseArrow.id)
		}

		const newShapeId = createShapeId()
		console.log("new arrow id: ", newShapeId)
		ids.push(newShapeId)
		editor.createShape({
			id: newShapeId,
			type: 'arrow',
			props: {
				start: {
					type: 'binding',
					boundShapeId: srcId,
					normalizedAnchor: normalizedSrcAnchor,
					isPrecise: false,
					isExact: false,
				},
				end: {
					type: 'binding',
					boundShapeId: dstId,
					normalizedAnchor: normalizedDstAnchor,
					isPrecise: false,
					isExact: false,
				},
				arrowheadStart: 'none',
				arrowheadEnd: 'arrow',
				text: text,
				font: 'draw',
			},
		})
	})

	return ids
}