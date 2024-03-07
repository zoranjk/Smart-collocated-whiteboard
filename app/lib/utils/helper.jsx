import { writeDoc, fetchDoc } from '../../firebase'

// Save data on the current page to Firebase, the default data_id is 'cur' for the latest global data
export const saveShapesOnCurPage = (editor, data_id="cur") => {
    const page = editor.getCurrentPageShapes()
    const shapes = JSON.stringify(page)
    writeDoc({ collection_name: 'data', id: data_id, data: {shapes: shapes} })
}

// Fetch the global data from Firebase, the default data_id is 'cur' for the latest global data, set idea_only is true if you only want to fetch the idea nodes
export const fetchSavedShapes = async ({data_id="cur", idea_only=false}) => {
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

export async function createArrowBetweenShapes (
	editor,
	relationship
) {
	console.log('relationship: ', relationship)

	relationship.forEach((rel) => {
		const srcId = rel.srcId
		const dstId = rel.dstId
		const srcShape = editor.getShape(srcId)
		const dstShape = editor.getShape(dstId)
		const text = rel.relation

		if (!srcShape || !dstShape) {
			throw new Error('Could not find shape')
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

		const newShapeId = createShapeId()
		editor.createShape({
			id: newShapeId,
			type: 'arrow',
			props: {
				start: {
					type: 'binding',
					boundShapeId: srcId,
					normalizedAnchor: normalizedSrcAnchor, 
					isExact: false,
				},
				end: {
					type: 'binding',
					boundShapeId: dstId,
					normalizedAnchor: normalizedDstAnchor,
					isExact: false,
				},
				arrowheadStart: 'none',
				arrowheadEnd: 'arrow',
				text: text,
				font: 'draw',
			},
		})
	})
}