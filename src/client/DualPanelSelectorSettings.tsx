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
  useIsFieldReadPretty,
  useCollectionField,
} from '@nocobase/client';
import { Tabs, Input, Form, Modal, Button, message, Radio, Switch, Select } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Schema } from '@formily/react';
import { NAMESPACE } from './constant';

// Custom component to display available fields
const FieldsInfoDisplay = ({ fields, t, parameterName = 'item' }) => {
  const handleCopyField = (fieldPath) => {
    navigator.clipboard
      .writeText(fieldPath)
      .then(() => {
        message.success(t('Copied!'));
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fieldPath;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        message.success(t('Copied!'));
      });
  };

  const fieldElements = useMemo(() => {
    if (!fields || fields.length === 0) {
      return <span>{t('No fields available')}</span>;
    }

    return fields.map((field, index) => {
      const fieldPath = `${parameterName}.${field.name}`;

      return (
        <span key={field.name}>
          <span
            onClick={() => handleCopyField(fieldPath)}
            style={{
              color: '#1890ff',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '12px',
              backgroundColor: '#f0f8ff',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #d6e4ff',
              display: 'inline-block',
              transition: 'all 0.2s ease',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.backgroundColor = '#e6f7ff';
              target.style.borderColor = '#91d5ff';
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.backgroundColor = '#f0f8ff';
              target.style.borderColor = '#d6e4ff';
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = 'none';
            }}
            title={t('Click to copy')}
          >
            {fieldPath}
          </span>
          {field.title && field.title !== field.name && (
            <span
              style={{
                color: '#999',
                fontSize: '12px',
                marginLeft: '4px',
                fontStyle: 'italic',
              }}
            >
              ({field.title})
            </span>
          )}
          {index < fields.length - 1 && (
            <span
              style={{
                margin: '0 8px',
                color: '#d9d9d9',
                fontSize: '12px',
              }}
            >
              •
            </span>
          )}
        </span>
      );
    });
  }, [fields, t, parameterName]);

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f6f6f6',
        border: '1px solid #d9d9d9',
        borderLeft: '4px solid #1890ff',
        borderRadius: '4px',
        fontSize: '13px',
        lineHeight: '1.8',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#1890ff',
          fontSize: '14px',
        }}
      >
        💡 {t('Available Fields Hint')}
      </div>
      <div style={{ color: '#666', lineHeight: '1.8' }}>
        <div style={{ marginBottom: '4px' }}>{t('Fields can be used in functions as')}:</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            lineHeight: '2',
          }}
        >
          {fieldElements}
        </div>
      </div>
    </div>
  );
};

// Configuration Modal Component with Tabs
const DualPanelSelectorConfigModal = ({
  visible,
  onCancel,
  onOk,
  field,
  fieldSchema,
  availableFields,
  t,
  dynamicDefaultRenderItem,
  dynamicDefaultRenderValue,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('text');

  // Initialize form values when modal opens
  React.useEffect(() => {
    if (visible) {
      const initialValues = {
        textConfig: {
          modalTitle: fieldSchema?.['x-component-props']?.textConfig?.modalTitle || fieldSchema?.['x-component-props']?.modalTitle || 'Dual Panel Selector',
          leftTitle: fieldSchema?.['x-component-props']?.textConfig?.leftTitle || fieldSchema?.['x-component-props']?.leftTitle || 'Menu',
          rightTitle: fieldSchema?.['x-component-props']?.textConfig?.rightTitle || fieldSchema?.['x-component-props']?.rightTitle || 'Buttons',
          searchPlaceholder: fieldSchema?.['x-component-props']?.textConfig?.searchPlaceholder || fieldSchema?.['x-component-props']?.searchPlaceholder || 'Keyword Search',
          cancelText: fieldSchema?.['x-component-props']?.textConfig?.cancelText || fieldSchema?.['x-component-props']?.cancelText || 'Cancel',
          confirmText: fieldSchema?.['x-component-props']?.textConfig?.confirmText || fieldSchema?.['x-component-props']?.confirmText || 'Confirm',
          emptyText: fieldSchema?.['x-component-props']?.textConfig?.emptyText || fieldSchema?.['x-component-props']?.emptyText || 'No data available',
          noButtonsText: fieldSchema?.['x-component-props']?.textConfig?.noButtonsText || fieldSchema?.['x-component-props']?.noButtonsText || 'Please click on a menu item to view its buttons',
        },
        dataConfig: {
          leftPanel: {
            typeField: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.typeField || 'type',
            typeValue: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.typeValue || '菜单',
            idField: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.idField || 'id',
            nameField: fieldSchema?.['x-component-props']?.dataConfig?.leftPanel?.nameField || 'name',
          },
          rightPanel: {
            typeField: fieldSchema?.['x-component-props']?.dataConfig?.rightPanel?.typeField || 'type',
            typeValue: fieldSchema?.['x-component-props']?.dataConfig?.rightPanel?.typeValue || '按钮',
            idField: fieldSchema?.['x-component-props']?.dataConfig?.rightPanel?.idField || 'id',
            nameField: fieldSchema?.['x-component-props']?.dataConfig?.rightPanel?.nameField || 'name',
          },
          filter: {
            method: fieldSchema?.['x-component-props']?.dataConfig?.filter?.method || 'name_contains',
            customFilterField: fieldSchema?.['x-component-props']?.dataConfig?.filter?.customFilterField || '',
          }
        }
      };
      form.setFieldsValue(initialValues);
    }
  }, [visible, fieldSchema, form]);

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
          leftTitle: currentValues.textConfig?.leftTitle || 'Menu',
          rightTitle: currentValues.textConfig?.rightTitle || 'Buttons',
          searchPlaceholder: currentValues.textConfig?.searchPlaceholder || 'Keyword Search',
          cancelText: currentValues.textConfig?.cancelText || 'Cancel',
          confirmText: currentValues.textConfig?.confirmText || 'Confirm',
          emptyText: currentValues.textConfig?.emptyText || 'No data available',
          noButtonsText: currentValues.textConfig?.noButtonsText || 'Please click on a menu item to view its buttons',
        },
        dataConfig: {
          leftPanel: {
            typeField: currentValues.dataConfig?.leftPanel?.typeField || 'type',
            typeValue: currentValues.dataConfig?.leftPanel?.typeValue || '菜单',
            idField: currentValues.dataConfig?.leftPanel?.idField || 'id',
            nameField: currentValues.dataConfig?.leftPanel?.nameField || 'name',
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
                     <Input placeholder="Menu" />
                   </Form.Item>
                   <Form.Item label="Right Panel Title" name={['textConfig', 'rightTitle']}>
                     <Input placeholder="Buttons" />
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
                   <Form.Item label="No Buttons Text" name={['textConfig', 'noButtonsText']}>
                     <Input placeholder="Please click on a menu item to view its buttons" />
                   </Form.Item>
                 </div>
               ),
             },
             {
               key: 'data',
               label: t('Data Field Configuration'),
               children: (
                 <div style={{ minHeight: '460px' }}>
                   <div style={{ marginBottom: 16 }}>
                     <h4>Left Panel (Menu) Field Mapping</h4>
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
                         Configure how to identify and display menu items in the left panel. 
                         The system will filter data based on these field mappings.
                       </div>
                     </div>
                     
                     <Form.Item 
                       label="Filter Field" 
                       name={['dataConfig', 'leftPanel', 'typeField']}
                       tooltip="Field name used to filter menu items (e.g., 'type', 'category', 'status')"
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
                       tooltip="Value of the filter field to identify menu items (e.g., '菜单', 'menu', 'category1')"
                     >
                       <Input placeholder="菜单" />
                     </Form.Item>
                     <Form.Item 
                       label="ID Field" 
                       name={['dataConfig', 'leftPanel', 'idField']}
                       tooltip="Field name that contains the unique identifier for each menu item"
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
                       tooltip="Field name that contains the display name for each menu item"
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
                     <h4>Right Panel (Buttons) Field Mapping</h4>
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
                         Configure how to identify and display button items in the right panel. 
                         These items will be filtered based on the selected menu item in the left panel.
                       </div>
                     </div>
                     
                     <Form.Item 
                       label="Filter Field" 
                       name={['dataConfig', 'rightPanel', 'typeField']}
                       tooltip="Field name used to filter button items (e.g., 'type', 'category', 'status')"
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
                       tooltip="Value of the filter field to identify button items (e.g., '按钮', 'button', 'action')"
                     >
                       <Input placeholder="按钮" />
                     </Form.Item>
                     <Form.Item 
                       label="ID Field" 
                       name={['dataConfig', 'rightPanel', 'idField']}
                       tooltip="Field name that contains the unique identifier for each button item"
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
                       tooltip="Field name that contains the display name for each button item"
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
                         Configure how to filter button items based on the selected menu item. 
                         Choose the method that matches your data structure.
                       </div>
                     </div>
                     
                     <Form.Item 
                       label="Filter Method" 
                       name={['dataConfig', 'filter', 'method']}
                       tooltip="Choose how to associate button items with menu items"
                     >
                       <Radio.Group>
                         <Radio value="name_contains">
                           <div>
                             <div style={{ fontWeight: '500' }}>Name Contains</div>
                             <div style={{ fontSize: '12px', color: '#666' }}>
                               Button name contains menu name (e.g., "菜单1-按钮1" contains "菜单1")
                             </div>
                           </div>
                         </Radio>
                         <Radio value="custom">
                           <div>
                             <div style={{ fontWeight: '500' }}>Custom Field</div>
                             <div style={{ fontSize: '12px', color: '#666' }}>
                               Button has a custom field that matches menu's ID
                             </div>
                           </div>
                         </Radio>
                       </Radio.Group>
                     </Form.Item>
                     <Form.Item 
                       label="Custom Filter Field" 
                       name={['dataConfig', 'filter', 'customFilterField']}
                       tooltip="Custom field name in button items that contains the menu's ID (used when method is 'Custom Field')"
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
        field={field}
        fieldSchema={fieldSchema}
        availableFields={availableFields}
        t={t}
        dynamicDefaultRenderItem={dynamicDefaultRenderItem}
        dynamicDefaultRenderValue={dynamicDefaultRenderValue}
      />
    </>
  );
}
