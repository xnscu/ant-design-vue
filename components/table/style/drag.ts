import type { CSSObject } from '../../_util/cssinjs';
import type { GenerateStyle } from '../../theme/internal';
import type { TableToken } from '.';

const genDragStyle: GenerateStyle<TableToken, CSSObject> = token => {
  const { componentCls, colorPrimary, motionDurationMid } = token;
  const dragIndicatorColor = colorPrimary;

  return {
    [`${componentCls}-wrapper`]: {
      // Draggable row cursor
      [`${componentCls}-row-draggable`]: {
        cursor: 'grab',

        '&:active': {
          cursor: 'grabbing',
        },
      },

      // Row being dragged
      [`${componentCls}-row-dragging`]: {
        opacity: 0.5,
        background: `${token.controlItemBgActive} !important`,

        '> td': {
          background: 'inherit !important',
        },
      },

      // Drop indicator: top border
      [`${componentCls}-row-dragpoint-top`]: {
        '> td': {
          borderTop: `2px solid ${dragIndicatorColor} !important`,
        },
      },

      // Drop indicator: bottom border
      [`${componentCls}-row-dragpoint-bottom`]: {
        '> td': {
          borderBottom: `2px solid ${dragIndicatorColor} !important`,
        },
      },

      // Drag handle icon styling
      [`${componentCls}-drag-handle`]: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        color: token.colorTextSecondary,
        transition: `color ${motionDurationMid}`,

        '&:hover': {
          color: token.colorText,
        },

        '&:active': {
          cursor: 'grabbing',
        },
      },
    },
  };
};

export default genDragStyle;
