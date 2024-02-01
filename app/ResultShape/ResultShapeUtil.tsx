import { BaseBoxShapeUtil, Rectangle2d } from "@tldraw/tldraw";

export type ResultShape = TLBaseShape<
	'result',
	{
		text: string,
		w: number,
		h: number,
		growX: number,
		font: string,
		size: string,
	}
>

export class ResultShapeUtil extends BaseBoxShapeUtil<ResultShape> {
	static override type = 'result' as const

	getDefaultProps(): ResultShape['props'] {
		return {
			text: '',
			w: 100,
			h: 100,
			growX: 0,
			font: 'sans',
			size: 's',
		}
	}

	override canEdit = () => true
	override canBind = () => false
	override canUnmount = () => false

	override getGeometry(shape: ResultShape) {
		return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
	}

	override component(shape: ResultShape) {
		const { id, type, props: { text, w, h } } = shape

		return (
			<div className="result-card">
				{text}
			</div>
		)
	}

	override indicator(shape: ResultShape) {
		return (
			<div></div>
		)
	}
}