import { TLArrowShape, TLShapeId, VecLike, stopEventPropagation } from '@tldraw/editor'
import * as React from 'react'
import { TextHelpers } from '../../lib/utils/TextHelpers'
import { ARROW_LABEL_FONT_SIZES, TEXT_PROPS } from '../../lib/utils/default-shape-constants'
import { useEditableText } from '../../lib/utils/useEditableText'
import '../../style.css'

export const ArrowTextLabel = React.memo(function ArrowTextLabel({
	id,
	text,
	size,
	font,
	position,
	width,
	labelColor,
	opacity
}: { id: TLShapeId; position: VecLike; width?: number; labelColor: string; opacity: number } & Pick<
	TLArrowShape['props'],
	'text' | 'size' | 'font'
>) {
	const {
		rInput,
		isEditing,
		handleFocus,
		handleBlur,
		handleKeyDown,
		handleChange,
		isEmpty,
		handleInputPointerDown,
		handleDoubleClick,
	} = useEditableText(id, 'arrow', text)

	const finalText = TextHelpers.normalizeTextForDom(text)
	const hasText = finalText.trim().length > 0

	if (!isEditing && !hasText) {
		return null
	}


	return (
		<div
			className="tl-arrow-label"
			// className="arrow-label"
			data-font={font}
			data-align={'center'}
			data-hastext={!isEmpty}
			data-isediting={isEditing}
			style={{
				textAlign: 'center',
				fontSize: ARROW_LABEL_FONT_SIZES[size],
				lineHeight: ARROW_LABEL_FONT_SIZES[size] * TEXT_PROPS.lineHeight + 'px',
				transform: `translate(${position.x}px, ${position.y}px)`,
				color: labelColor,
				opacity: opacity
			}}
		>
			<div className="tl-arrow-label__inner">
				<p style={{ width: width ? width : '9px' }}>
					{text ? TextHelpers.normalizeTextForDom(text) : ' '}
				</p>
				{isEditing && (
					// Consider replacing with content-editable
					<textarea
						ref={rInput}
						className="tl-text tl-text-input"
						name="text"
						tabIndex={-1}
						autoComplete="off"
						autoCapitalize="off"
						autoCorrect="off"
						autoSave="off"
						autoFocus
						placeholder=""
						spellCheck="true"
						wrap="off"
						dir="auto"
						datatype="wysiwyg"
						defaultValue={text}
						onFocus={handleFocus}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
						onTouchEnd={stopEventPropagation}
						onContextMenu={stopEventPropagation}
						onPointerDown={handleInputPointerDown}
						onDoubleClick={handleDoubleClick}
					/>
				)}
			</div>
		</div>
	)
})
