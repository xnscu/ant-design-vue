<docs>
---
order: 50
title:
  en-US: Drag Row
  zh-CN: 拖曳排序
---

## zh-CN

通过 `rowDrag` 属性启用行拖曳排序功能。拖动行到新位置后，通过 `@rowDragEnd` 事件获取重排后的数据。

## en-US

Enable row drag-and-drop reordering via the `rowDrag` prop. After dropping a row to a new position, the `@rowDragEnd` event provides the reordered data.
</docs>

<template>
  <a-table
    :columns="columns"
    :data-source="dataSource"
    :row-drag="true"
    row-key="key"
    :pagination="false"
    @rowDragEnd="onRowDragEnd"
  >
    <template #bodyCell="{ column }">
      <template v-if="column.key === 'drag'">
        <holder-outlined style="cursor: grab" />
      </template>
    </template>
  </a-table>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { HolderOutlined } from '@ant-design/icons-vue';
import type { RowDragEvent } from 'ant-design-vue/es/table';

const columns = [
  {
    title: '',
    key: 'drag',
    width: 40,
    align: 'center' as const,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
  },
];

const dataSource = ref([
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sydney No. 1 Lake Park',
  },
  {
    key: '4',
    name: 'Jon Snow',
    age: 26,
    address: 'Ottawa No. 2 Lake Park',
  },
  {
    key: '5',
    name: 'Jack White',
    age: 38,
    address: 'Dublin No. 3 Lake Park',
  },
]);

const onRowDragEnd = (event: RowDragEvent) => {
  dataSource.value = event.data;
};
</script>
