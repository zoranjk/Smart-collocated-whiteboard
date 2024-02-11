import { useState } from 'react'
import { groupNotes } from '../lib/utils/groupUtil'
import { stopEventPropagation } from '@tldraw/tldraw'

export const GroupMenu = ({editor}) => {

    const handleGrouping = (e) => {
		e.stopPropagation()

        const shapes = editor.getCurrentPageShapes().filter(shape => shape.type === 'node')

		console.log("Shapes: ", shapes)
		
        groupNotes(editor, shapes, 'Group', 200, 200)
    }

	return (
		<div>
			<button onClick={handleGrouping} onPointerDown={stopEventPropagation}>Group</button>
		</div>
	)
}
