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
import { SearchOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { useFieldSchema } from '@formily/react';
import { useRequest } from '@nocobase/client';
import { DualPanelSelectorCommonProps, buildQueryParams, createDebouncedSearch } from './utils';

const { Search } = Input;

export const ModalDualPanelSelector: React.FC<DualPanelSelectorCommonProps> = observer(
  ({
    value,
    onChange,
    placeholder,
    collectionField,
    collection,
    record,
  }) => {
    // State management
    const [visible, setVisible] = useState(false);
    const [leftSearch, setLeftSearch] = useState('');
    const [debouncedLeftSearch, setDebouncedLeftSearch] = useState('');
    const [leftSelectedKeys, setLeftSelectedKeys] = useState<string[]>([]);
    const [rightSelectedKeys, setRightSelectedKeys] = useState<string[]>([]);
    const [activeLeftItemId, setActiveLeftItemId] = useState<string | null>(null);

    // Refs
    const inputRef = useRef<any>(null);

    // Get configuration from field schema
    const fieldSchema = useFieldSchema();
    const textConfig = fieldSchema?.['x-component-props']?.textConfig || {};
    const dataConfig = fieldSchema?.['x-component-props']?.dataConfig || {};
    
    // Text configuration
    const modalTitle = textConfig.modalTitle || fieldSchema?.['x-component-props']?.modalTitle || 'Dual Panel Selector';
    const configLeftTitle = textConfig.leftTitle || fieldSchema?.['x-component-props']?.leftTitle || 'Left Panel';
    const configRightTitle = textConfig.rightTitle || fieldSchema?.['x-component-props']?.rightTitle || 'Right Panel';
    const searchPlaceholder = textConfig.searchPlaceholder || fieldSchema?.['x-component-props']?.searchPlaceholder || 'Keyword Search';
    const cancelText = textConfig.cancelText || fieldSchema?.['x-component-props']?.cancelText || 'Cancel';
    const confirmText = textConfig.confirmText || fieldSchema?.['x-component-props']?.confirmText || 'Confirm';
    const emptyText = textConfig.emptyText || fieldSchema?.['x-component-props']?.emptyText || 'No data available';
    const noButtonsText = textConfig.noButtonsText || fieldSchema?.['x-component-props']?.noButtonsText || 'Please click on a left panel item to view its related items';
    
    // Data configuration
    const commonFilterConfig = dataConfig.commonFilter || {};
    const leftPanelConfig = dataConfig.leftPanel || {};
    const rightPanelConfig = dataConfig.rightPanel || {};
    const filterConfig = dataConfig.filter || {};
    
    const leftTypeField = leftPanelConfig.typeField || 'type';
    const leftTypeValue = leftPanelConfig.typeValue || 'left';
    const leftIdField = leftPanelConfig.idField || 'id';
    const leftNameField = leftPanelConfig.nameField || 'name';
    const leftParentField = leftPanelConfig.parentField || '';
    const leftParentIdField = leftPanelConfig.parentIdField || '';
    const leftEnableTree = leftPanelConfig.enableTree || false;
    

    
    const rightTypeField = rightPanelConfig.typeField || 'type';
    const rightTypeValue = rightPanelConfig.typeValue || 'right';
    const rightIdField = rightPanelConfig.idField || 'id';
    const rightNameField = rightPanelConfig.nameField || 'name';
    
    const commonFilterEnabled = commonFilterConfig.enabled || false;
    const commonFilterField = commonFilterConfig.field || '';
    const commonFilterValue = commonFilterConfig.value || '';
    
    const filterMethod = filterConfig.method || 'name_contains';
    const customFilterField = filterConfig.customFilterField || '';
    const customFilterParentField = filterConfig.customFilterParentField || '';

    // Helper function to build tree structure
    const buildTreeData = useCallback((items: any[]) => {
      if (!leftEnableTree || !leftParentField) {
        // Return flat structure if tree is not enabled
        return items.map((item: any) => ({
          key: item[leftIdField],
          title: item[leftNameField] || item[leftIdField],
          ...item,
        }));
      }

      // Create a map for quick lookup by code field
      const itemMapByCode = new Map();
      const itemMapById = new Map();
      const rootItems = [];

      // First pass: create all items and build lookup maps
      items.forEach((item: any) => {
        const treeItem = {
          key: item[leftIdField],
          title: item[leftNameField] || item[leftIdField],
          children: [],
          ...item,
        };
        
        // Map by ID
        itemMapById.set(item[leftIdField], treeItem);
        
        // Map by code field (if exists)
        if (item.code) {
          itemMapByCode.set(item.code, treeItem);
        }
      });

      // Second pass: build parent-child relationships
      items.forEach((item: any) => {
        const treeItem = itemMapById.get(item[leftIdField]);
        const parentCode = item[leftParentField];

        // Check if this item has a parent
        if (parentCode) {
          // Try to find parent by code
          const parent = itemMapByCode.get(parentCode);
          
          if (parent) {
            parent.children.push(treeItem);
          } else {
            // If parent not found, treat as root item
            rootItems.push(treeItem);
          }
        } else {
          // No parent, treat as root item
          rootItems.push(treeItem);
        }
      });

      return rootItems;
    }, [leftEnableTree, leftParentField, leftParentIdField, leftIdField, leftNameField]);

    // Helper function to build filter with common filter
    const buildFilterWithCommon = useCallback((baseFilter: any, panelFilter: any) => {
      const filters = [];
      
      // Add common filter if enabled
      if (commonFilterEnabled && commonFilterField && commonFilterValue) {
        filters.push({ [commonFilterField]: commonFilterValue });
      }
      
      // Add base filter (search, etc.)
      if (baseFilter) {
        filters.push(baseFilter);
      }
      
      // Add panel-specific filter
      if (panelFilter) {
        filters.push(panelFilter);
      }
      
      // Return appropriate filter structure
      if (filters.length === 0) {
        return {};
      } else if (filters.length === 1) {
        return filters[0];
      } else {
        return { $and: filters };
      }
    }, [commonFilterEnabled, commonFilterField, commonFilterValue]);

    // Debounced search handling
    const debouncedSetLeftSearch = createDebouncedSearch(setDebouncedLeftSearch);

    useEffect(() => {
      debouncedSetLeftSearch(leftSearch);
    }, [leftSearch]);

    // Build query parameters for left panel data only
    const leftQueryParams = useMemo(() => {
      const params = buildQueryParams(collectionField, debouncedLeftSearch, collection, record, 1, 1000);
      // Build filter with common filter and left panel specific filter
      const panelFilter = { [leftTypeField]: leftTypeValue };
      params.filter = buildFilterWithCommon(params.filter, panelFilter);
      return params;
    }, [collectionField, debouncedLeftSearch, collection, record, leftTypeField, leftTypeValue, buildFilterWithCommon]);

    // Build query parameters for right panel data
    const rightQueryParams = useMemo(() => {
      const params = buildQueryParams(collectionField, '', collection, record, 1, 1000);
      // Build filter with common filter and right panel specific filter
      const panelFilter = { [rightTypeField]: rightTypeValue };
      params.filter = buildFilterWithCommon(params.filter, panelFilter);
      return params;
    }, [collectionField, collection, record, rightTypeField, rightTypeValue, buildFilterWithCommon]);

    // Left panel data query
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

    // Right panel data query
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

    // Transform data to tree structure
    const treeData = useMemo(() => {
      if (!leftData?.data) return [];
      
      const items = leftData.data;
      return buildTreeData(items);
    }, [leftData, buildTreeData]);



    // Transform right data to checkbox items
    const checkboxItems = useMemo(() => {
      if (!rightData?.data || !activeLeftItemId) return [];
      
      // Get the active left panel item name for filtering
              const activeLeftItem = leftData?.data?.find((item: any) => item[leftIdField] === activeLeftItemId);
        const activeLeftItemName = activeLeftItem?.[leftNameField];
      
              if (!activeLeftItemName) return [];
      
      // Filter right panel items based on configured filter method
              const filteredRightItems = rightData.data.filter((item: any) => {
        switch (filterMethod) {
          case 'name_contains':
            // Check if right panel item name contains the active left panel item name
            return item[rightNameField] && item[rightNameField].includes(activeLeftItemName);
          case 'custom':
            // Check if right panel item has custom field matching active left panel item field value
            return item[customFilterField] === activeLeftItem[customFilterParentField];
          default:
            return false;
        }
      });
      
              return filteredRightItems.map((item: any) => ({
        key: item[rightIdField],
        label: item[rightNameField] || item[rightIdField],
        group: item[rightTypeField] || 'Other',
        ...item,
      }));
    }, [rightData, activeLeftItemId, leftData, leftIdField, leftNameField, rightIdField, rightNameField, rightTypeField, filterMethod, customFilterField]);

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

    // Request right panel data when active left panel item changes
    useEffect(() => {
              if (visible && activeLeftItemId && rightQueryParams) {
        runRightQuery();
      }
      // Don't clear right selection when no active left panel item - keep them independent
          }, [visible, activeLeftItemId, rightQueryParams, runRightQuery]);

    // Handle opening modal
    const handleOpen = useCallback(() => {
      setVisible(true);
    }, []);

    // Handle closing modal
    const handleClose = useCallback(() => {
      setVisible(false);
      setActiveLeftItemId(null);
      // Don't reset selected keys here as we want to preserve them for next open
    }, []);

    // Tree utility functions
    const treeUtils = useMemo(() => {
      const findParentKeys = (nodeKey: string, treeData: any[]): string[] => {
        const parentKeys: string[] = [];
        
        const findParents = (nodes: any[], targetKey: string, currentPath: string[] = []): boolean => {
          for (const node of nodes) {
            if (node.key === targetKey) {
              parentKeys.push(...currentPath);
              return true;
            }
            if (node.children && node.children.length > 0) {
              if (findParents(node.children, targetKey, [...currentPath, node.key])) {
                return true;
              }
            }
          }
          return false;
        };
        
        findParents(treeData, nodeKey);
        return parentKeys;
      };

      const findChildKeys = (nodeKey: string, treeData: any[]): string[] => {
        const childKeys: string[] = [];
        
        const findChildren = (nodes: any[]): void => {
          for (const node of nodes) {
            if (node.key === nodeKey) {
              const collectChildren = (n: any): void => {
                childKeys.push(n.key);
                if (n.children && n.children.length > 0) {
                  n.children.forEach(collectChildren);
                }
              };
              if (node.children && node.children.length > 0) {
                node.children.forEach(collectChildren);
              }
              return;
            }
            if (node.children && node.children.length > 0) {
              findChildren(node.children);
            }
          }
        };
        
        findChildren(treeData);
        return childKeys;
      };

      return { findParentKeys, findChildKeys };
    }, [treeData]);



    // Selection synchronization logic
    const selectionSync = useMemo(() => {
      const syncRightToLeft = (newRightSelection: string[], newlySelectedKeys: string[]) => {
        if (activeLeftItemId && newlySelectedKeys.length > 0) {
          const currentLeftSelection = new Set(leftSelectedKeys);
          currentLeftSelection.add(activeLeftItemId);
          setLeftSelectedKeys(Array.from(currentLeftSelection));
        }
      };

      const syncLeftToRight = (newlyUncheckedKeys: string[]) => {
        if (newlyUncheckedKeys.length === 0) return;

        const keysToRemove = new Set<string>();
        const allUncheckedNodes = new Set<string>();

        // Collect all unchecked nodes and their children
        newlyUncheckedKeys.forEach(uncheckedKey => {
          allUncheckedNodes.add(uncheckedKey);
          const childKeys = treeUtils.findChildKeys(uncheckedKey, treeData);
          childKeys.forEach(childKey => {
            allUncheckedNodes.add(childKey);
          });
        });

        // Find related right panel items to remove
        if (rightData?.data) {
          rightData.data.forEach((item: any) => {
            const itemKey = item[rightIdField];
            if (rightSelectedKeys.includes(itemKey)) {
              let shouldRemove = false;

              for (const uncheckedNodeKey of allUncheckedNodes) {
                const uncheckedNode = leftData?.data?.find((leftItem: any) => leftItem[leftIdField] === uncheckedNodeKey);
                if (uncheckedNode) {
                  const uncheckedNodeName = uncheckedNode[leftNameField];

                  switch (filterMethod) {
                    case 'name_contains':
                      if (item[rightNameField] && item[rightNameField].includes(uncheckedNodeName)) {
                        shouldRemove = true;
                        break;
                      }
                      break;
                    case 'custom':
                      if (item[customFilterField] === uncheckedNode[customFilterParentField]) {
                        shouldRemove = true;
                        break;
                      }
                      break;
                  }
                }
                if (shouldRemove) break;
              }

              if (shouldRemove) {
                keysToRemove.add(itemKey);
              }
            }
          });
        }

        // Remove related items from right panel selection
        if (keysToRemove.size > 0) {
          const newRightSelection = rightSelectedKeys.filter(key => !keysToRemove.has(key));
          setRightSelectedKeys(newRightSelection);
        }
      };

      return { syncRightToLeft, syncLeftToRight };
    }, [activeLeftItemId, leftSelectedKeys, treeUtils, treeData, rightData, leftData, leftIdField, leftNameField, rightIdField, rightNameField, filterMethod, customFilterField, rightSelectedKeys]);

    // Handle right panel selection
    const handleRightSelect = useCallback((checkedKeys: string[]) => {
      const visibleKeys = checkboxItems.map(item => item.key);
      const hiddenSelectedKeys = rightSelectedKeys.filter(key => !visibleKeys.includes(key));
      const newSelection = [...new Set([...hiddenSelectedKeys, ...checkedKeys])];
      
      const previouslySelectedVisibleKeys = rightSelectedKeys.filter(key => visibleKeys.includes(key));
      const newlySelectedKeys = checkedKeys.filter(key => !previouslySelectedVisibleKeys.includes(key));
      
      setRightSelectedKeys(newSelection);
      selectionSync.syncRightToLeft(newSelection, newlySelectedKeys);
    }, [checkboxItems, rightSelectedKeys, selectionSync]);



    // Handle left panel selection changes
    const handleLeftSelect = useCallback((checkedKeys: string[]) => {
      const newlyUncheckedKeys = leftSelectedKeys.filter(key => !checkedKeys.includes(key));
      
      setLeftSelectedKeys(checkedKeys);
      selectionSync.syncLeftToRight(newlyUncheckedKeys);
    }, [leftSelectedKeys, selectionSync]);

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
        
        // Determine left and right items based on configured type values
        const leftKeys = selectedItems
          .filter(item => item[leftTypeField] === leftTypeValue)
          .map(item => item[leftIdField]);
        
        const rightKeys = selectedItems
          .filter(item => item[rightTypeField] === rightTypeValue)
          .map(item => item[rightIdField]);
        
        // 如果 treeData 为空，延迟初始化，等待 treeData 加载完成
        // 如果 treeData 不为空，只传递叶子节点给 Tree 组件，让 Tree 组件自己计算父级的部分选中状态
        if (treeData && treeData.length > 0) {
          const leafKeys = leftKeys.filter(key => {
            // 在 treeData 中查找节点
            const findNode = (nodes: any[]): any => {
              for (const node of nodes) {
                if (node.key === key) return node;
                if (node.children && node.children.length > 0) {
                  const found = findNode(node.children);
                  if (found) return found;
                }
              }
              return null;
            };
            
            const node = findNode(treeData);
            // 只包含叶子节点（没有子级的节点）
            return node && (!node.children || node.children.length === 0);
          });
          
          setLeftSelectedKeys(leafKeys);
        }
        // 如果 treeData 为空，不设置 leftSelectedKeys，等待 treeData 加载完成后再初始化
        setRightSelectedKeys(rightKeys);
        
        // Set active left panel item if there are selected right panel items
        if (rightKeys.length > 0 && leftKeys.length > 0) {
          setActiveLeftItemId(leftKeys[0]);
        }
      }
    }, [visible, value, leftTypeField, leftTypeValue, leftIdField, rightTypeField, rightTypeValue, rightIdField]);

    // 当 treeData 加载完成时，重新初始化左侧选中状态
    useEffect(() => {
      if (visible && treeData && treeData.length > 0 && value) {
        const selectedItems = Array.isArray(value) ? value : [value];
        const leftKeys = selectedItems
          .filter(item => item[leftTypeField] === leftTypeValue)
          .map(item => item[leftIdField]);
        
        if (leftKeys.length > 0) {
          const leafKeys = leftKeys.filter(key => {
            // 在 treeData 中查找节点
            const findNode = (nodes: any[]): any => {
              for (const node of nodes) {
                if (node.key === key) return node;
                if (node.children && node.children.length > 0) {
                  const found = findNode(node.children);
                  if (found) return found;
                }
              }
              return null;
            };
            
            const node = findNode(treeData);
            // 只包含叶子节点（没有子级的节点）
            return node && (!node.children || node.children.length === 0);
          });
          
          setLeftSelectedKeys(leafKeys);
        }
      }
    }, [treeData, visible, value, leftTypeField, leftTypeValue, leftIdField]);

    const handleOk = () => {
      const selectedItems = [];
      
      // Add selected left panel items
      if (leftSelectedKeys.length > 0 && leftData?.data) {
        // 获取所有需要保存的左侧项目（包括父级）
        const allSelectedLeftKeys = new Set(leftSelectedKeys);
        
        // 为每个选中的项目添加其父级
        leftSelectedKeys.forEach(selectedKey => {
          const parentKeys = treeUtils.findParentKeys(selectedKey, treeData);
          parentKeys.forEach(parentKey => {
            allSelectedLeftKeys.add(parentKey);
          });
        });
        
        const selectedLeftItems = leftData.data
          .filter((item: any) => allSelectedLeftKeys.has(item[leftIdField]))
          .map((item: any) => ({
            ...item,
            [leftTypeField]: leftTypeValue, // Add type information for identification
          }));
        selectedItems.push(...selectedLeftItems);
      }
      
      // Add selected right panel items
      if (rightSelectedKeys.length > 0 && rightData?.data) {
        const selectedRightItems = rightData.data
          .filter((item: any) => rightSelectedKeys.includes(item[rightIdField]))
          .map((item: any) => ({
            ...item,
            [rightTypeField]: rightTypeValue, // Add type information for identification
          }));
        selectedItems.push(...selectedRightItems);
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
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Left Panel - Tree with Checkboxes */}
            <Card 
              title={configLeftTitle} 
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              styles={{ body: { flex: 1, overflow: 'hidden' } }}
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
                    <Tree
                      treeData={treeData}
                      checkable
                      checkedKeys={leftSelectedKeys}
                      onCheck={handleLeftSelect as any}
                      onSelect={(selectedKeys) => {
                        if (selectedKeys.length > 0) {
                          setActiveLeftItemId(selectedKeys[0] as string);
                        } else {
                          setActiveLeftItemId(null);
                        }
                      }}
                      style={{ height: '100%', overflow: 'auto' }}
                    />
                  ) : (
                    <Empty description={emptyText} />
                  )}
                </Spin>
              </div>
            </Card>

            {/* Right Panel - Checkboxes */}
            <Card 
              title={`${configRightTitle}${activeLeftItemId ? ` (${leftData?.data?.find((item: any) => item[leftIdField] === activeLeftItemId)?.[leftNameField] || 'Unknown'})` : ''}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              styles={{ body: { flex: 1, overflow: 'hidden' } }}
            >
              <div style={{ flex: 1, overflow: 'auto' }}>
                <Spin spinning={rightLoading}>
                  {!activeLeftItemId ? (
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
