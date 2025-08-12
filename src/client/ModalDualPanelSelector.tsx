/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Modal, Input, Tree, Checkbox, Spin, Button, Card, Empty, Tag } from 'antd';
import { SearchOutlined, CheckOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { useFieldSchema } from '@formily/react';
import { useRequest } from '@nocobase/client';
import { DualPanelSelectorCommonProps, buildQueryParams, createDebouncedSearch } from './utils';
import { NAMESPACE } from './constant';

const { Search } = Input;

export const ModalDualPanelSelector: React.FC<DualPanelSelectorCommonProps> = observer(
  ({
    value,
    onChange,
    placeholder,
    leftTitle,
    rightTitle,
    collectionField,
    isRequired,
    collection,
    record,
  }) => {
    // State management
    const [visible, setVisible] = useState(false);
    const [leftSearch, setLeftSearch] = useState('');
    const [debouncedLeftSearch, setDebouncedLeftSearch] = useState('');
    const [leftSelectedKeys, setLeftSelectedKeys] = useState<string[]>([]);
    const [rightSelectedKeys, setRightSelectedKeys] = useState<string[]>([]);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Refs
    const inputRef = useRef<any>(null);

    // Get configuration from field schema
    const fieldSchema = useFieldSchema();
    const textConfig = fieldSchema?.['x-component-props']?.textConfig || {};
    const dataConfig = fieldSchema?.['x-component-props']?.dataConfig || {};
    
    // Text configuration
    const modalTitle = textConfig.modalTitle || fieldSchema?.['x-component-props']?.modalTitle || 'Dual Panel Selector';
    const configLeftTitle = textConfig.leftTitle || fieldSchema?.['x-component-props']?.leftTitle || 'Menu';
    const configRightTitle = textConfig.rightTitle || fieldSchema?.['x-component-props']?.rightTitle || 'Buttons';
    const searchPlaceholder = textConfig.searchPlaceholder || fieldSchema?.['x-component-props']?.searchPlaceholder || 'Keyword Search';
    const cancelText = textConfig.cancelText || fieldSchema?.['x-component-props']?.cancelText || 'Cancel';
    const confirmText = textConfig.confirmText || fieldSchema?.['x-component-props']?.confirmText || 'Confirm';
    const emptyText = textConfig.emptyText || fieldSchema?.['x-component-props']?.emptyText || 'No data available';
    const noButtonsText = textConfig.noButtonsText || fieldSchema?.['x-component-props']?.noButtonsText || 'Please click on a menu item to view its buttons';
    
    // Data configuration
    const leftPanelConfig = dataConfig.leftPanel || {};
    const rightPanelConfig = dataConfig.rightPanel || {};
    const filterConfig = dataConfig.filter || {};
    
    const leftTypeField = leftPanelConfig.typeField || 'type';
    const leftTypeValue = leftPanelConfig.typeValue || '菜单';
    const leftIdField = leftPanelConfig.idField || 'id';
    const leftNameField = leftPanelConfig.nameField || 'name';
    
    const rightTypeField = rightPanelConfig.typeField || 'type';
    const rightTypeValue = rightPanelConfig.typeValue || '按钮';
    const rightIdField = rightPanelConfig.idField || 'id';
    const rightNameField = rightPanelConfig.nameField || 'name';
    
    const filterMethod = filterConfig.method || 'name_contains';
    const customFilterField = filterConfig.customFilterField || '';

    // Debounced search handling
    const debouncedSetLeftSearch = createDebouncedSearch(setDebouncedLeftSearch);

    useEffect(() => {
      debouncedSetLeftSearch(leftSearch);
    }, [leftSearch]);

    // Build query parameters for left panel (menu data only)
    const leftQueryParams = useMemo(() => {
      const params = buildQueryParams(collectionField, debouncedLeftSearch, collection, record, 1, 1000);
      // Filter to show only menu items based on configured type field and value
      if (params.filter) {
        params.filter = {
          $and: [
            params.filter,
            { [leftTypeField]: leftTypeValue }
          ]
        };
      } else {
        params.filter = { [leftTypeField]: leftTypeValue };
      }
      return params;
    }, [collectionField, debouncedLeftSearch, collection, record, leftTypeField, leftTypeValue]);

    // Build query parameters for right panel (button data)
    const rightQueryParams = useMemo(() => {
      const params = buildQueryParams(collectionField, '', collection, record, 1, 1000);
      // Filter to show button data based on configured type field and value
      if (params.filter) {
        params.filter = {
          $and: [
            params.filter,
            { [rightTypeField]: rightTypeValue }
          ]
        };
      } else {
        params.filter = { [rightTypeField]: rightTypeValue };
      }
      return params;
    }, [collectionField, collection, record, rightTypeField, rightTypeValue]);

    // Left panel data query (menu data)
    const { data: leftData, loading: leftLoading, run: runLeftQuery } = useRequest(
      {
        resource: collectionField?.target,
        action: 'list',
        params: leftQueryParams,
      },
      {
        manual: true,
        refreshDeps: [leftQueryParams],
      },
    );

    // Right panel data query (button data)
    const { data: rightData, loading: rightLoading, run: runRightQuery } = useRequest(
      {
        resource: collectionField?.target,
        action: 'list',
        params: rightQueryParams,
      },
      {
        manual: true,
        refreshDeps: [rightQueryParams],
      },
    );

    // Transform data to tree structure with checkboxes
    const treeData = useMemo(() => {
      if (!leftData?.data) return [];
      
      const items = leftData.data;
      
      // For now, just create a flat list without parent-child relationships
      return items.map((item: any) => ({
        key: item[leftIdField],
        title: (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '4px 0',
              backgroundColor: activeMenuId === item[leftIdField] ? '#f0f0f0' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Toggle active state
              if (activeMenuId === item[leftIdField]) {
                setActiveMenuId(null);
              } else {
                setActiveMenuId(item[leftIdField]);
              }
            }}
          >
            <Checkbox 
              checked={leftSelectedKeys.includes(item[leftIdField])}
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.checked) {
                  const newLeftSelection = [...leftSelectedKeys, item[leftIdField]];
                  setLeftSelectedKeys(newLeftSelection);
                  // Clear right selection when left selection changes
                  setRightSelectedKeys([]);
                } else {
                  const newLeftSelection = leftSelectedKeys.filter(key => key !== item[leftIdField]);
                  setLeftSelectedKeys(newLeftSelection);
                  // Clear right selection when left selection changes
                  setRightSelectedKeys([]);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span style={{ marginLeft: '8px' }}>
              {item[leftNameField] || item[leftIdField]}
            </span>
          </div>
        ),
        ...item,
      }));
    }, [leftData, leftSelectedKeys, activeMenuId, leftIdField, leftNameField]);

    // Transform right data to checkbox items
    const checkboxItems = useMemo(() => {
      if (!rightData?.data || !activeMenuId) return [];
      
      // Get the active menu name for filtering
      const activeMenu = leftData?.data?.find((item: any) => item[leftIdField] === activeMenuId);
      const activeMenuName = activeMenu?.[leftNameField];
      
      if (!activeMenuName) return [];
      
      // Filter buttons based on configured filter method
      const filteredButtons = rightData.data.filter((item: any) => {
        switch (filterMethod) {
          case 'name_contains':
            // Check if button name contains the active menu name
            return item[rightNameField] && item[rightNameField].includes(activeMenuName);
          case 'custom':
            // Check if button has custom field matching active menu id
            return item[customFilterField] === activeMenuId;
          default:
            return false;
        }
      });
      
      return filteredButtons.map((item: any) => ({
        key: item[rightIdField],
        label: item[rightNameField] || item[rightIdField],
        group: item[rightTypeField] || 'Other',
        ...item,
      }));
    }, [rightData, activeMenuId, leftData, leftIdField, leftNameField, rightIdField, rightNameField, rightTypeField, filterMethod, customFilterField]);

    // Group checkbox items
    const groupedCheckboxItems = useMemo(() => {
      const groups: Record<string, any[]> = {};
      
      checkboxItems.forEach(item => {
        const group = item.group || 'Other';
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(item);
      });
      
      return groups;
    }, [checkboxItems]);

    // Request data when modal is visible
    useEffect(() => {
      if (visible && collectionField?.target && leftQueryParams) {
        runLeftQuery();
      }
    }, [visible, collectionField?.target, leftQueryParams, runLeftQuery]);

    // Request right panel data when active menu changes
    useEffect(() => {
      if (visible && activeMenuId && rightQueryParams) {
        runRightQuery();
      }
      // Don't clear right selection when no active menu - keep them independent
    }, [visible, activeMenuId, rightQueryParams, runRightQuery]);

    // Handle opening modal
    const handleOpen = useCallback(() => {
      setVisible(true);
    }, []);

    // Handle closing modal
    const handleClose = useCallback(() => {
      setVisible(false);
      setActiveMenuId(null);
      // Don't reset selected keys here as we want to preserve them for next open
    }, []);

    // Handle right panel selection
    const handleRightSelect = useCallback((checkedKeys: string[]) => {
      // Get currently visible button keys
      const visibleKeys = checkboxItems.map(item => item.key);
      
      // Keep previously selected keys that are not currently visible
      const hiddenSelectedKeys = rightSelectedKeys.filter(key => !visibleKeys.includes(key));
      
      // Combine hidden selected keys with newly checked keys
      const newSelection = [...new Set([...hiddenSelectedKeys, ...checkedKeys])];
      
      setRightSelectedKeys(newSelection);
    }, [checkboxItems, rightSelectedKeys]);

    const renderSelectedTags = () => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return <span style={{ color: '#999' }}>{placeholder || 'Please select'}</span>;
      }

      if (Array.isArray(value)) {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            {value.map((item, index) => (
              <Tag
                key={item.id || index}
                closable
                onClose={(e) => {
                  e.stopPropagation();
                  const newValue = value.filter(v => v.id !== item.id);
                  onChange?.(newValue);
                }}
                style={{ margin: 0 }}
              >
                {item.name || item.id}
              </Tag>
            ))}
          </div>
        );
      }

      return <span>{value}</span>;
    };

    // Initialize selected keys from value when modal opens
    useEffect(() => {
      if (visible && value) {
        const selectedItems = Array.isArray(value) ? value : [value];
        const leftKeys = selectedItems.filter(item => item.type === '菜单').map(item => item.id);
        const rightKeys = selectedItems.filter(item => item.type === '按钮').map(item => item.id);
        
        setLeftSelectedKeys(leftKeys);
        setRightSelectedKeys(rightKeys);
        
        // Set active menu if there are selected buttons
        if (rightKeys.length > 0 && leftKeys.length > 0) {
          setActiveMenuId(leftKeys[0]);
        }
      }
    }, [visible, value]);

    const handleOk = () => {
      const selectedItems = [];
      
      // Add selected menu items
      if (leftSelectedKeys.length > 0 && leftData?.data) {
        const selectedMenus = leftData.data.filter((item: any) => leftSelectedKeys.includes(item.id));
        selectedItems.push(...selectedMenus);
      }
      
      // Add selected button items
      if (rightSelectedKeys.length > 0 && rightData?.data) {
        const selectedButtons = rightData.data.filter((item: any) => rightSelectedKeys.includes(item.id));
        selectedItems.push(...selectedButtons);
      }
      
      onChange?.(selectedItems);
      setVisible(false);
    };

    return (
      <>
        <div
          ref={inputRef}
          onClick={handleOpen}
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            backgroundColor: '#fff',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {renderSelectedTags()}
          </div>
        </div>

        <Modal
          title={modalTitle}
          open={visible}
          onCancel={handleClose}
          onOk={handleOk}
          width={1200}
          destroyOnClose
          footer={[
            <Button key="cancel" onClick={handleClose}>
              {cancelText}
            </Button>,
            <Button key="ok" type="primary" onClick={handleOk}>
              {confirmText}
            </Button>,
          ]}
        >
          <div style={{ display: 'flex', gap: 16, height: 500 }}>
            {/* Left Panel - Tree with Checkboxes */}
            <Card 
              title={configLeftTitle} 
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1, overflow: 'hidden' }}
            >
              <Search
                placeholder={searchPlaceholder}
                value={leftSearch}
                onChange={(e) => setLeftSearch(e.target.value)}
                style={{ marginBottom: 16 }}
                prefix={<SearchOutlined />}
              />
              
              <div style={{ flex: 1, overflow: 'auto' }}>
                <Spin spinning={leftLoading}>
                  {treeData.length > 0 ? (
                    <div>
                      {treeData.map((item: any) => (
                        <div
                          key={item.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            marginBottom: '4px',
                            backgroundColor: activeMenuId === item.key ? '#e6f7ff' : 'transparent',
                            border: activeMenuId === item.key ? '1px solid #91d5ff' : '1px solid transparent',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuId === item.key) {
                              setActiveMenuId(null);
                            } else {
                              setActiveMenuId(item.key);
                            }
                          }}
                        >
                          <Checkbox 
                            checked={leftSelectedKeys.includes(item.key)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                const newLeftSelection = [...leftSelectedKeys, item.key];
                                setLeftSelectedKeys(newLeftSelection);
                                // Don't clear right selection when adding left selection
                              } else {
                                const newLeftSelection = leftSelectedKeys.filter(key => key !== item.key);
                                setLeftSelectedKeys(newLeftSelection);
                                // Don't clear right selection when removing left selection
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginRight: '12px' }}
                          />
                          <span>{item.name || item.id}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description={emptyText} />
                  )}
                </Spin>
              </div>
            </Card>

            {/* Right Panel - Checkboxes */}
            <Card 
              title={`${configRightTitle}${activeMenuId ? ` (${leftData?.data?.find((item: any) => item.id === activeMenuId)?.name || 'Unknown'})` : ''}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1, overflow: 'hidden' }}
            >
              <div style={{ flex: 1, overflow: 'auto' }}>
                <Spin spinning={rightLoading}>
                  {!activeMenuId ? (
                    <Empty description={noButtonsText} />
                  ) : Object.keys(groupedCheckboxItems).length > 0 ? (
                    <Checkbox.Group
                      value={rightSelectedKeys.filter(key => 
                        checkboxItems.some(item => item.key === key)
                      )}
                      onChange={handleRightSelect}
                      style={{ width: '100%' }}
                    >
                      {Object.entries(groupedCheckboxItems).map(([group, items]) => (
                        <div key={group} style={{ marginBottom: 16 }}>
                          <div style={{ paddingLeft: 16 }}>
                            {items.map(item => (
                              <div key={item.key} style={{ marginBottom: 4 }}>
                                <Checkbox value={item.key}>{item.label}</Checkbox>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </Checkbox.Group>
                  ) : (
                    <Empty description={noButtonsText} />
                  )}
                </Spin>
              </div>
            </Card>
          </div>
        </Modal>
      </>
    );
  },
);
