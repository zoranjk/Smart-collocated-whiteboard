import { DefaultColorStyle, DefaultFontStyle, ArrowShapeTerminal, ArrowShapeArrowheadEndStyle, ArrowShapeArrowheadStartStyle, DefaultFillStyle, DefaultDashStyle, DefaultHorizontalAlignStyle, DefaultSizeStyle,  DefaultVerticalAlignStyle,  ShapeProps, T } from '@tldraw/tldraw'
import { CustomArrowShapeType } from './CustomArrowShapeType'
import { idValidator } from '../lib/utils/id-validator'
import { createRecordType, defineMigrations, RecordId, UnknownRecord } from '@tldraw/store'

export interface VecModel {
	x: number
	y: number
	z?: number
}

export const vecModelValidator: T.Validator<VecModel> = T.object({
	x: T.number,
	y: T.number,
	z: T.number.optional(),
})

export type TLUnknownShape = TLBaseShape<string, object>
export type TLShapeId = RecordId<TLUnknownShape>

export const shapeIdValidator = idValidator<TLShapeId>('shape')

const ArrowShapeTerminal = T.union('type', {
	binding: T.object({
		type: T.literal('binding'),
		boundShapeId: shapeIdValidator,
		normalizedAnchor: vecModelValidator,
		isExact: T.boolean,
		isPrecise: T.boolean,
	}),
	point: T.object({
		type: T.literal('point'),
		x: T.number,
		y: T.number,
	}),
})

/** @public */
export type TLArrowShapeTerminal = T.TypeOf<typeof ArrowShapeTerminal>

export const cusArrowShapeProps = {
	color: DefaultColorStyle,
	fill: DefaultFillStyle,
	dash: DefaultDashStyle,
	size: DefaultSizeStyle,
	arrowheadStart: ArrowShapeArrowheadStartStyle,
	arrowheadEnd: ArrowShapeArrowheadEndStyle,
	font: DefaultFontStyle,
	start: ArrowShapeTerminal,
	end: ArrowShapeTerminal,
	bend: T.number,
	text: T.string,
	labelPosition: T.number,
    opacity: T.number,
}