import { TLBaseShape, TLDefaultColorStyle, TLDefaultSizeStyle, TLDefaultHorizontalAlignStyle, TLDefaultFontStyle, TLDefaultVerticalAlignStyle } from '@tldraw/tldraw'

export type CustomArrowShapeType = TLBaseShape<
	'new_arrow',
	{
        color: string
        fill: string
        dash: string
        size: string
        arrowheadStart: any
        arrowheadEnd: any
        font: any
        start: any
        end: any
        bend: number
        text: string
        labelPosition: number
        opacity: number
    }
>