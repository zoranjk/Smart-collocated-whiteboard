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