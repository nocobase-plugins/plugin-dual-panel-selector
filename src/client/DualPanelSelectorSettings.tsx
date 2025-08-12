/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import {
  useCollection,
  useDesignable,
  SchemaSettingsItem,
} from '@nocobase/client';
import { Tabs, Input, Form, Modal, Button, message, Radio, Select, Switch } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Schema } from '@formily/react';
import { NAMESPACE } from './constant';

// Configuration Modal Component with Tabs
const DualPanelSelectorConfigModal = ({
  visible,
  onCancel,
  onOk,
  fieldSchema,
  availableFields,
  t,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('text');

  // Initialize form values when modal opens
  React.useEffect(() => {
    if (visible) {
      const initialValues = {
        textConfig: {
          modalTitle: fieldSchema?.['x-component-props']?.textConfig?.modalTitle || fieldSchema?.['x-component-props']?.modalTitle || 'Dual Panel Selector',
                  leftTitle: fieldSchema?.['x-component-props']?.textConfig?.leftTitle || fieldSchema?.['x-component-props']?.leftTitle || 'Left Panel',
        rightTitle: fieldSchema?.['x-component-props']?.textConfig?.rightTitle || fieldSchema?.['x-component-props']?.rightTitle || 'Right Panel',
          searchPlaceholder: fieldSchema?.['x-component-props']?.textConfig?.searchPlaceholder || fieldSchema?.['x-component-props']?.searchPlaceholder || 'Keyword Search',
          cancelText: fieldSchema?.['x-component-props']?.textConfig?.cancelText || fieldSchema?.['x-component-props']?.cancelText || 'Cancel',
          confirmText: fieldSchema?.['x-component-props']?.textConfig?.confirmText || fieldSchema?.['x-component-props']?.confirmText || 'Confirm',
          emptyText: fieldSchema?.['x-component-props']?.textConfig?.emptyText || fieldSchema?.['x-component-props']?.emptyText || 'No data available',
          noButtonsText: fieldSchema?.['x-component-props']?.textConfig?.noButtonsText || fieldSchema?.['x-component-props']?.noButtonsText || 'Please click on a left panel item to view its related items',
        },
        dataConfig: {
          commonFilter: {
            enabled: fieldSchema?.['x-component-props']?.dataConfig?.commonFilter?.enabled || false,
            field: fieldSchema?.['x-component-props']?.dataConfig?.commonFilter?.field || undefined,
            value: fieldSchema?.['x-component-props']?.dataConfig?.commonFilter?.value || '',
          },
          leftPanel: {
            typeField: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.typeField || 'type',
            typeValue: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.typeValue || '菜单',
            idField: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.idField || 'id',
            nameField: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.nameField || 'name',
            parentField: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.parentField || undefined,
            parentIdField: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.parentIdField || undefined,
            enableTree: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.enableTree || false,
          },
          rightPanel: {
            typeField: fieldSchema?.['x-component-props']?.dataConfig?.rightPanel?.typeField || 'type',
            typeValue: fieldSchema?.['x-component-props']?.dataConfig?.rightPanel?.typeValue || '按钮',
            idField: fieldSchema?.['x-component-props']?.dataConfig?.rightPanel?.idField || 'id',
            nameField: fieldSchema?.['x-component-props']?.dataConfig?.rightPanel?.nameField || 'name',
          },
          filter: {
            method: fieldSchema?.['x-component-props']?.dataConfig?.filter?.method || 'name_contains',
            customFilterField: fieldSchema?.['x-component-props']?.dataConfig?.filter?.customFilterField || undefined,
            customFilterParentField: fieldSchema?.['x-component-props']?.dataConfig?.filter?.customFilterParentField || undefined,
          }
        }
      };
      form.setFieldsValue(initialValues);
    }
  }, [visible, fieldSchema, form]);

  // Listen for common filter enable/disable changes
  const commonFilterEnabled = Form.useWatch(['dataConfig', 'commonFilter', 'enabled'], form);
  
  // Listen for tree structure enable/disable changes
  const treeEnabled = Form.useWatch(['dataConfig', 'leftPanel', 'enableTree'], form);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Get current form values, including empty strings
      const currentValues = form.getFieldsValue();

      // For each field, use the current form value, or default if undefined/null
      // Empty string means user intentionally cleared it, should use default
      const completeValues = {
        textConfig: {
          modalTitle: currentValues.textConfig?.modalTitle || 'Dual Panel Selector',
                  leftTitle: currentValues.textConfig?.leftTitle || 'Left Panel',
        rightTitle: currentValues.textConfig?.rightTitle || 'Right Panel',
          searchPlaceholder: currentValues.textConfig?.searchPlaceholder || 'Keyword Search',
          cancelText: currentValues.textConfig?.cancelText || 'Cancel',
          confirmText: currentValues.textConfig?.confirmText || 'Confirm',
          emptyText: currentValues.textConfig?.emptyText || 'No data available',
          noButtonsText: currentValues.textConfig?.noButtonsText || 'Please click on a left panel item to view its related items',
        },
        dataConfig: {
          commonFilter: {
            enabled: currentValues.dataConfig?.commonFilter?.enabled || false,
            field: currentValues.dataConfig?.commonFilter?.field || '',
            value: currentValues.dataConfig?.commonFilter?.value || '',
          },
          leftPanel: {
            typeField: currentValues.dataConfig?.leftPanel?.typeField || 'type',
            typeValue: currentValues.dataConfig?.leftPanel?.typeValue || '菜单',
            idField: currentValues.dataConfig?.leftPanel?.idField || 'id',
            nameField: currentValues.dataConfig?.leftPanel?.nameField || 'name',
            parentField: currentValues.dataConfig?.leftPanel?.parentField || '',
            parentIdField: currentValues.dataConfig?.leftPanel?.parentIdField || '',
            enableTree: currentValues.dataConfig?.leftPanel?.enableTree || false,
          },
          rightPanel: {
            typeField: currentValues.dataConfig?.rightPanel?.typeField || 'type',
            typeValue: currentValues.dataConfig?.rightPanel?.typeValue || '按钮',
            idField: currentValues.dataConfig?.rightPanel?.idField || 'id',
            nameField: currentValues.dataConfig?.rightPanel?.nameField || 'name',
          },
          filter: {
            method: currentValues.dataConfig?.filter?.method || 'name_contains',
            customFilterField: currentValues.dataConfig?.filter?.customFilterField || '',
            customFilterParentField: currentValues.dataConfig?.filter?.customFilterParentField || '',
          }
        }
      };
      onOk(completeValues);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={t('Configure Dual Panel Selector')}
      open={visible}
      onCancel={onCancel}
      width="80%"
      style={{ minHeight: '600px' }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk}>
          {t('Save')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ minHeight: '500px' }}
          items={[
                         {
               key: 'text',
               label: t('Text Configuration'),
               children: (
                 <div style={{ minHeight: '460px' }}>
                   <Form.Item label="Modal Title" name={['textConfig', 'modalTitle']}>
                     <Input placeholder="Dual Panel Selector" />
                   </Form.Item>
                   <Form.Item label="Left Panel Title" name={['textConfig', 'leftTitle']}>
                     <Input placeholder="Left Panel" />
                   </Form.Item>
                   <Form.Item label="Right Panel Title" name={['textConfig', 'rightTitle']}>
                     <Input placeholder="Right Panel" />
                   </Form.Item>
                   <Form.Item label="Search Placeholder" name={['textConfig', 'searchPlaceholder']}>
                     <Input placeholder="Keyword Search" />
                   </Form.Item>
                   <Form.Item label="Cancel Button Text" name={['textConfig', 'cancelText']}>
                     <Input placeholder="Cancel" />
                   </Form.Item>
                   <Form.Item label="Confirm Button Text" name={['textConfig', 'confirmText']}>
                     <Input placeholder="Confirm" />
                   </Form.Item>
                   <Form.Item label="Empty State Text" name={['textConfig', 'emptyText']}>
                     <Input placeholder="No data available" />
                   </Form.Item>
                                       <Form.Item label="No Right Panel Items Text" name={['textConfig', 'noButtonsText']}>
                      <Input placeholder="Please click on a left panel item to view its related items" />
                   </Form.Item>
                 </div>
               ),
             },
             {
               key: 'data',
               label: t('Data Field Configuration'),
               children: (
                 <div style={{ minHeight: '460px' }}>
                   {/* Common Filter Configuration */}
                   <div style={{ marginBottom: 24 }}>
                     <h4>Common Filter Configuration</h4>
                     <div style={{ 
                       backgroundColor: '#fff7e6', 
                       border: '1px solid #ffd591', 
                       borderRadius: '6px', 
                       padding: '12px',
                       marginBottom: '12px'
                     }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         marginBottom: '8px',
                         color: '#fa8c16',
                         fontWeight: '500'
                       }}>
                         <span style={{ marginRight: '8px' }}>🔧</span>
                         Common Filter Configuration Hint
                       </div>
                       <div style={{ fontSize: '14px', color: '#595959', lineHeight: '1.5' }}>
                         Configure a common filter that will be applied to both left and right panels. 
                         This filter will be combined with the specific panel filters.
                       </div>
                     </div>
                     
                     <Form.Item 
                       label="Enable Common Filter" 
                       name={['dataConfig', 'commonFilter', 'enabled']}
                       valuePropName="checked"
                       tooltip="Enable or disable the common filter for both panels"
                     >
                       <Switch />
                     </Form.Item>
                     
                     <Form.Item 
                       label="Common Filter Field" 
                       name={['dataConfig', 'commonFilter', 'field']}
                       tooltip="Field name for the common filter (e.g., 'status', 'enabled', 'active')"
                     >
                       <Select
                         placeholder="Select common filter field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                         disabled={!commonFilterEnabled}
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                     
                     <Form.Item 
                       label="Common Filter Value" 
                       name={['dataConfig', 'commonFilter', 'value']}
                       tooltip="Value for the common filter (e.g., 'active', 'enabled', '1')"
                     >
                       <Input 
                         placeholder="Enter common filter value" 
                         disabled={!commonFilterEnabled}
                       />
                     </Form.Item>
                   </div>
                   
                   <div style={{ marginBottom: 16 }}>
                     <h4>Left Panel Field Mapping</h4>
                     <div style={{ 
                       backgroundColor: '#f6ffed', 
                       border: '1px solid #b7eb8f', 
                       borderRadius: '6px', 
                       padding: '12px',
                       marginBottom: '12px'
                     }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         marginBottom: '8px',
                         color: '#52c41a',
                         fontWeight: '500'
                       }}>
                         <span style={{ marginRight: '8px' }}>💡</span>
                         Left Panel Configuration Hint
                       </div>
                       <div style={{ fontSize: '14px', color: '#595959', lineHeight: '1.5' }}>
                         Configure how to identify and display items in the left panel. 
                         The system will filter data based on these field mappings.
                       </div>
                     </div>
                     
                     <Form.Item 
                       label="Filter Field" 
                       name={['dataConfig', 'leftPanel', 'typeField']}
                       tooltip="Field name used to filter left panel items (e.g., 'type', 'category', 'status')"
                     >
                       <Select
                         placeholder="Select filter field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                     <Form.Item 
                       label="Filter Value" 
                       name={['dataConfig', 'leftPanel', 'typeValue']}
                       tooltip="Value of the filter field to identify left panel items (e.g., 'category', 'type1', 'group1')"
                     >
                       <Input placeholder="菜单" />
                     </Form.Item>
                     <Form.Item 
                       label="ID Field" 
                       name={['dataConfig', 'leftPanel', 'idField']}
                       tooltip="Field name that contains the unique identifier for each left panel item"
                     >
                       <Select
                         placeholder="Select ID field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                     <Form.Item 
                       label="Name Field" 
                       name={['dataConfig', 'leftPanel', 'nameField']}
                       tooltip="Field name that contains the display name for each left panel item"
                     >
                       <Select
                         placeholder="Select name field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                     
                     <Form.Item 
                       label="Enable Tree Structure" 
                       name={['dataConfig', 'leftPanel', 'enableTree']}
                       valuePropName="checked"
                       tooltip="Enable tree structure display for left panel items"
                     >
                       <Switch />
                     </Form.Item>
                     
                     <Form.Item 
                       label="Parent Field" 
                       name={['dataConfig', 'leftPanel', 'parentField']}
                       tooltip="Field name that contains the parent's code/ID (e.g., 'parent_code', 'parent_id')"
                     >
                       <Select
                         placeholder="Select parent field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                         disabled={!treeEnabled}
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                     
                     <Form.Item 
                       label="Parent ID Field" 
                       name={['dataConfig', 'leftPanel', 'parentIdField']}
                       tooltip="Field name that contains the parent's unique identifier (e.g., 'parent_unique_code', 'parent_id') - optional, if not set will use Parent Field"
                     >
                       <Select
                         placeholder="Select parent ID field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                         disabled={!treeEnabled}
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                   </div>
                   
                   <div style={{ marginBottom: 16 }}>
                     <h4>Right Panel Field Mapping</h4>
                     <div style={{ 
                       backgroundColor: '#f6ffed', 
                       border: '1px solid #b7eb8f', 
                       borderRadius: '6px', 
                       padding: '12px',
                       marginBottom: '12px'
                     }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         marginBottom: '8px',
                         color: '#52c41a',
                         fontWeight: '500'
                       }}>
                         <span style={{ marginRight: '8px' }}>💡</span>
                         Right Panel Configuration Hint
                       </div>
                       <div style={{ fontSize: '14px', color: '#595959', lineHeight: '1.5' }}>
                                                Configure how to identify and display items in the right panel.
                       These items will be filtered based on the selected item in the left panel.
                       </div>
                     </div>
                     
                     <Form.Item 
                       label="Filter Field" 
                       name={['dataConfig', 'rightPanel', 'typeField']}
                       tooltip="Field name used to filter right panel items (e.g., 'type', 'category', 'status')"
                     >
                       <Select
                         placeholder="Select filter field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                     <Form.Item 
                       label="Filter Value" 
                       name={['dataConfig', 'rightPanel', 'typeValue']}
                       tooltip="Value of the filter field to identify right panel items (e.g., 'action', 'item', 'subitem')"
                     >
                       <Input placeholder="按钮" />
                     </Form.Item>
                     <Form.Item 
                       label="ID Field" 
                       name={['dataConfig', 'rightPanel', 'idField']}
                       tooltip="Field name that contains the unique identifier for each right panel item"
                     >
                       <Select
                         placeholder="Select ID field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                     <Form.Item 
                       label="Name Field" 
                       name={['dataConfig', 'rightPanel', 'nameField']}
                       tooltip="Field name that contains the display name for each right panel item"
                     >
                       <Select
                         placeholder="Select name field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                   </div>
                   
                   <div style={{ marginBottom: 16 }}>
                     <h4>Filter Logic Configuration</h4>
                     <div style={{ 
                       backgroundColor: '#f6ffed', 
                       border: '1px solid #b7eb8f', 
                       borderRadius: '6px', 
                       padding: '12px',
                       marginBottom: '12px'
                     }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         marginBottom: '8px',
                         color: '#52c41a',
                         fontWeight: '500'
                       }}>
                         <span style={{ marginRight: '8px' }}>💡</span>
                         Filter Logic Configuration Hint
                       </div>
                       <div style={{ fontSize: '14px', color: '#595959', lineHeight: '1.5' }}>
                         Configure how to filter right panel items based on the selected left panel item. 
                         Choose the method that matches your data structure.
                       </div>
                     </div>
                     
                     <Form.Item 
                       label="Filter Method" 
                       name={['dataConfig', 'filter', 'method']}
                       tooltip="Choose how to associate right panel items with left panel items"
                     >
                       <Radio.Group>
                         <Radio value="name_contains">
                           <div>
                             <div style={{ fontWeight: '500' }}>Name Contains</div>
                             <div style={{ fontSize: '12px', color: '#666' }}>
                               Right panel item name contains left panel item name (e.g., "Category1-Item1" contains "Category1")
                             </div>
                           </div>
                         </Radio>
                         <Radio value="custom">
                           <div>
                             <div style={{ fontWeight: '500' }}>Custom Field</div>
                             <div style={{ fontSize: '12px', color: '#666' }}>
                               Right panel item has a custom field that matches left panel item's field value
                             </div>
                           </div>
                         </Radio>
                       </Radio.Group>
                     </Form.Item>
                     <Form.Item 
                       label="Custom Filter Field" 
                       name={['dataConfig', 'filter', 'customFilterField']}
                       tooltip="Custom field name in right panel items that contains the left panel item's specific field (used when method is 'Custom Field')"
                     >
                       <Select
                         placeholder="Select custom filter field"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                     <Form.Item 
                       label="Left Panel Field for Comparison" 
                       name={['dataConfig', 'filter', 'customFilterParentField']}
                       tooltip="Field name from the left panel that contains the value to compare with the custom filter field (used when method is 'Custom Field')"
                     >
                       <Select
                         placeholder="Select left panel field for comparison"
                         showSearch
                         allowClear
                         optionFilterProp="children"
                       >
                         {availableFields.map(field => (
                           <Select.Option key={field.name} value={field.name}>
                             {field.name} {field.title && field.title !== field.name && `(${field.title})`}
                           </Select.Option>
                         ))}
                       </Select>
                     </Form.Item>
                   </div>
                 </div>
               ),
             },
          ]}
        />
      </Form>
    </Modal>
  );
};

// Configuration component using custom Modal with Tabs
export function DualPanelSelectorConfigEditor(props) {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation(NAMESPACE);
  const collection = useCollection();
  const [modalVisible, setModalVisible] = useState(false);

  // Get available fields information
  const availableFields = useMemo(() => {
    if (!collection || !fieldSchema) {
      return [];
    }

    // Get the association field
    const collectionField =
      collection.getField(fieldSchema['name']) || collection.getField(fieldSchema['x-collection-field']);

    if (!collectionField?.target) {
      return [];
    }

    // Get target collection
    const targetCollection = collection.collectionManager.getCollection(collectionField.target);

    if (!targetCollection) {
      return [];
    }

    // Get all fields from target collection
    const fields = targetCollection.getFields();

    // Format field information for display
    const formattedFields = fields
      .map((field) => ({
        name: field.name,
        title: Schema.compile(field.uiSchema?.title || field.name, { t }),
        interface: field.interface,
        type: field.type,
      }))
      .filter((field) => field.name); // Filter out fields without names

    return formattedFields;
  }, [collection, fieldSchema]);

  // Generate dynamic default render functions based on available fields
  const dynamicDefaultRenderItem = useMemo(() => {
    if (availableFields.length === 0) {
      return `function(item) { return '<span>No data</span>'; }`;
    }

    // Find the best field to display (priority: id, name, title, nickname, username, first available)
    const priorityFields = ['id', 'name', 'title', 'nickname', 'username'];
    let displayField = null;

    for (const priority of priorityFields) {
      displayField = availableFields.find((field) => field.name === priority);
      if (displayField) break;
    }

    // If no priority field found, use the first available field
    if (!displayField && availableFields.length > 0) {
      displayField = availableFields[0];
    }

    return `function(item) {
  if (!item) return '<span>No data</span>';
  var displayValue = item.${displayField.name} || '';
  return '<span>' + String(displayValue) + '</span>';
}`;
  }, [availableFields]);

  const dynamicDefaultRenderValue = useMemo(() => {
    if (availableFields.length === 0) {
      return `function(value) { return '<span>No data</span>'; }`;
    }

    // Find the best field to display (same logic as renderItem)
    const priorityFields = ['id', 'name', 'title', 'nickname', 'username'];
    let displayField = null;

    for (const priority of priorityFields) {
      displayField = availableFields.find((field) => field.name === priority);
      if (displayField) break;
    }

    // If no priority field found, use the first available field
    if (!displayField && availableFields.length > 0) {
      displayField = availableFields[0];
    }

    return `function(value) {
  if (!value) return '<span>No data</span>';
  var displayValue = value.${displayField.name} || '';
  return '<span>' + String(displayValue) + '</span>';
}`;
  }, [availableFields]);

  const handleModalOk = async (values) => {
    const { textConfig, dataConfig } = values;

    // Save configuration to field schema
    field.componentProps = field.componentProps || {};
    field.componentProps.textConfig = textConfig;
    field.componentProps.dataConfig = dataConfig;

    // Directly update fieldSchema like plugin-custom-selector does
    _.set(fieldSchema, 'x-component-props.textConfig', textConfig);
    _.set(fieldSchema, 'x-component-props.dataConfig', dataConfig);

    const patchData = {
      schema: {
        'x-uid': fieldSchema['x-uid'],
        'x-component-props': {
          ...fieldSchema['x-component-props'],
          textConfig,
          dataConfig,
        },
      },
    };

    dn.emit('patch', patchData);

    message.success(t('Configuration saved successfully'));
    setModalVisible(false);
  };

  return (
    <>
      <SchemaSettingsItem title={t('Configure Dual Panel Selector')} onClick={() => setModalVisible(true)} />
      <DualPanelSelectorConfigModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalOk}
        fieldSchema={fieldSchema}
        availableFields={availableFields}
        t={t}
      />
    </>
  );
}
