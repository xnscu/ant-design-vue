import type { ComputedRef } from 'vue';
import { ref } from 'vue';
import type { GetRowKey } from '../interface';

export interface RowDragEvent<RecordType = any> {
  /** The original drag event */
  originalEvent: DragEvent;
  /** The index of the dragged row in the current data */
  dragIndex: number;
  /** The index of the drop target row in the current data */
  dropIndex: number;
  /** The reordered data array after the drag */
  data: RecordType[];
}

export interface RowDragConfig {
  /** Whether row dragging is enabled */
  enabled: boolean;
  /**
   * A function to determine whether a specific row can be dragged.
   * If not provided, all rows are draggable.
   */
  canDrag?: (record: any, index: number) => boolean;
  /**
   * Custom drag handle column key — if provided, only the handle element triggers dragging.
   * If not provided, the entire row is draggable.
   */
  handleColumnKey?: string;
}

function reorderArray<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

export default function useRowDrag(
  rowDrag: ComputedRef<boolean | RowDragConfig | undefined>,
  data: ComputedRef<any[]>,
  _getRowKey: ComputedRef<GetRowKey<any>>,
  prefixCls: ComputedRef<string>,
  emit: (event: string, ...args: any[]) => void,
) {
  const draggingIndex = ref<number | null>(null);
  const droppedIndex = ref<number | null>(null);
  const rowDragging = ref(false);

  const isEnabled = (): boolean => {
    const val = rowDrag.value;
    if (!val) return false;
    if (typeof val === 'boolean') return val;
    return val.enabled;
  };

  const canDragRow = (record: any, index: number): boolean => {
    const val = rowDrag.value;
    if (!val) return false;
    if (typeof val === 'boolean') return true;
    if (val.canDrag) return val.canDrag(record, index);
    return true;
  };

  const hasHandle = (): boolean => {
    const val = rowDrag.value;
    if (!val || typeof val === 'boolean') return false;
    return !!val.handleColumnKey;
  };

  /**
   * Build the customRow wrapper that adds drag events to each row.
   * This merges with the user's existing customRow if present.
   */
  const buildDragCustomRow = (
    userCustomRow?: (record: any, index: number) => Record<string, any>,
  ) => {
    return (record: any, index: number) => {
      const userProps = userCustomRow ? userCustomRow(record, index) : {};

      if (!isEnabled() || !canDragRow(record, index)) {
        return userProps;
      }

      const useHandle = hasHandle();
      const cls = prefixCls.value;

      return {
        ...userProps,
        draggable: !useHandle, // if no handle, the whole row is draggable
        class: [
          userProps.class,
          `${cls}-row-draggable`,
          rowDragging.value && draggingIndex.value === index ? `${cls}-row-dragging` : '',
        ]
          .filter(Boolean)
          .join(' '),
        onMousedown: (event: MouseEvent) => {
          userProps.onMousedown?.(event);
          if (useHandle) {
            // Check if the target or its parent has the drag handle attribute
            const target = event.target as HTMLElement;
            const isHandle = target.closest(`[data-row-drag-handle]`) !== null;
            if (isHandle) {
              (event.currentTarget as HTMLElement).draggable = true;
            } else {
              (event.currentTarget as HTMLElement).draggable = false;
            }
          }
        },
        onDragstart: (event: DragEvent) => {
          userProps.onDragstart?.(event);
          rowDragging.value = true;
          draggingIndex.value = index;
          // Firefox requires this to make dragging possible
          event.dataTransfer?.setData('text', 'b');
        },
        onDragover: (event: DragEvent) => {
          userProps.onDragover?.(event);
          if (!rowDragging.value || draggingIndex.value === index) return;

          event.preventDefault();
          const rowElement = event.currentTarget as HTMLElement;
          const rowY = rowElement.getBoundingClientRect().top;
          const rowHeight = rowElement.offsetHeight;
          const pageY = event.clientY;
          const rowMidY = rowY + rowHeight / 2;
          const prevRowElement = rowElement.previousElementSibling as HTMLElement | null;

          // Clean up previous indicators on this element and its neighbors
          rowElement.classList.remove(`${cls}-row-dragpoint-top`, `${cls}-row-dragpoint-bottom`);
          if (prevRowElement) {
            prevRowElement.classList.remove(`${cls}-row-dragpoint-bottom`);
          }

          if (pageY < rowMidY) {
            // Drop before this row
            droppedIndex.value = index;
            if (prevRowElement && prevRowElement.classList.contains(`${cls}-row`)) {
              prevRowElement.classList.add(`${cls}-row-dragpoint-bottom`);
            } else {
              rowElement.classList.add(`${cls}-row-dragpoint-top`);
            }
          } else {
            // Drop after this row
            droppedIndex.value = index + 1;
            rowElement.classList.add(`${cls}-row-dragpoint-bottom`);
          }
        },
        onDragleave: (event: DragEvent) => {
          userProps.onDragleave?.(event);
          const rowElement = event.currentTarget as HTMLElement;
          const prevRowElement = rowElement.previousElementSibling as HTMLElement | null;

          rowElement.classList.remove(`${cls}-row-dragpoint-top`, `${cls}-row-dragpoint-bottom`);
          if (prevRowElement) {
            prevRowElement.classList.remove(`${cls}-row-dragpoint-bottom`);
          }
        },
        onDragend: (event: DragEvent) => {
          userProps.onDragend?.(event);
          rowDragging.value = false;
          draggingIndex.value = null;
          droppedIndex.value = null;
          (event.currentTarget as HTMLElement).draggable = !useHandle ? true : false;

          // Clean up all drag indicators
          const tableEl = (event.currentTarget as HTMLElement).closest(`.${cls}-wrapper`);
          if (tableEl) {
            tableEl
              .querySelectorAll(`.${cls}-row-dragpoint-top, .${cls}-row-dragpoint-bottom`)
              .forEach(el => {
                el.classList.remove(`${cls}-row-dragpoint-top`, `${cls}-row-dragpoint-bottom`);
              });
          }
        },
        onDrop: (event: DragEvent) => {
          userProps.onDrop?.(event);
          event.preventDefault();

          if (droppedIndex.value != null && draggingIndex.value != null) {
            const fromIndex = draggingIndex.value;
            let toIndex =
              fromIndex > droppedIndex.value
                ? droppedIndex.value
                : droppedIndex.value === 0
                ? 0
                : droppedIndex.value - 1;

            if (fromIndex !== toIndex) {
              const reorderedData = reorderArray(data.value, fromIndex, toIndex);
              emit('rowDragEnd', {
                originalEvent: event,
                dragIndex: fromIndex,
                dropIndex: toIndex,
                data: reorderedData,
              } as RowDragEvent);
            }
          }

          // Cleanup
          const cls2 = prefixCls.value;
          const rowElement = event.currentTarget as HTMLElement;
          const prevRowElement = rowElement.previousElementSibling as HTMLElement | null;
          rowElement.classList.remove(`${cls2}-row-dragpoint-top`, `${cls2}-row-dragpoint-bottom`);
          if (prevRowElement) {
            prevRowElement.classList.remove(`${cls2}-row-dragpoint-bottom`);
          }

          rowDragging.value = false;
          draggingIndex.value = null;
          droppedIndex.value = null;
        },
      };
    };
  };

  return {
    buildDragCustomRow,
    rowDragging,
    draggingIndex,
    droppedIndex,
  };
}
