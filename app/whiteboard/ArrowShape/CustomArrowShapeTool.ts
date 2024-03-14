import { StateNode } from '@tldraw/editor'
import { Idle } from './toolStates/Idle'
import { Pointing } from './toolStates/Pointing'

/** @public */
export class CustomArrowShapeTool extends StateNode {
	static override id = 'new_arrow'
	static override initial = 'idle'
	static override children = () => [Idle, Pointing]

	override shapeType = 'new_arrow'
}
