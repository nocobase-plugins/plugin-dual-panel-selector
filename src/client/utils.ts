/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { debounce } from 'lodash';

// Common interfaces
export interface DualPanelSelectorCommonProps {
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  leftTitle: string;
  rightTitle: string;
  collectionField: any;
  isRequired: boolean;
  collection: any;
  record: any;
}

// Query parameters builder utility
export const buildQueryParams = (
  collectionField: any,
  search: string,
  collection: any,
  record: any,
  page = 1,
  pageSize = 10,
) => {
  if (!collectionField?.target) return null;

  const params: any = {
    page,
    pageSize,
  };

  // Search filter - support multiple fields
  if (search.trim()) {
    // Get target collection to access all fields
    const targetCollection = collection?.collectionManager?.getCollection(collectionField.target);

    if (targetCollection) {
      // Get all fields from target collection
      const allFields = targetCollection.getFields();

      // Filter fields that can be searched with $includes
      const searchableFields = allFields
        .filter((field: any) => {
          if (!field || !field.name) return false;

          // Exclude sensitive field types that shouldn't be searchable
          const excludedTypes = ['password', 'token'];
          const excludedInterfaces = ['password', 'token'];

          // Exclude sensitive fields
          if (excludedTypes.includes(field.type) || excludedInterfaces.includes(field.interface)) {
            return false;
          }

          // Exclude fields with sensitive names
          const sensitiveFieldNames = ['password', 'token', 'resetToken', 'accessToken', 'refreshToken', 'apiToken'];
          if (sensitiveFieldNames.some((name) => field.name.toLowerCase().includes(name.toLowerCase()))) {
            return false;
          }

          // Only include fields that support $includes operation
          const supportedTypes = [
            'string',
            'text',
            'email',
            'phone',
            'uid',
            'nanoid',
            'integer',
            'bigInt',
            'float',
            'double',
            'decimal',
          ];

          const supportedInterfaces = [
            'input',
            'textarea',
            'email',
            'phone',
            'integer',
            'number',
            'percent',
            'currency',
            'select',
            'radioGroup',
            'checkboxGroup',
          ];

          // Check both type and interface to ensure compatibility
          return supportedTypes.includes(field.type) || supportedInterfaces.includes(field.interface);
        })
        .map((field: any) => ({
          name: field.name,
          type: field.type,
          interface: field.interface,
        }));

      // Build $or query for compatible fields only
      if (searchableFields.length > 0) {
        const searchTerm = search.trim();

        // Create search conditions for each compatible field
        const searchConditions = searchableFields.map((field: any) => {
          // For numeric fields, try exact match if search term is numeric
          if (['integer', 'bigInt', 'float', 'double', 'decimal'].includes(field.type)) {
            const numericValue = parseFloat(searchTerm);
            if (!isNaN(numericValue)) {
              return {
                $or: [{ [field.name]: { $includes: searchTerm } }, { [field.name]: { $eq: numericValue } }],
              };
            }
          }

          // For other compatible fields, use includes search
          return {
            [field.name]: {
              $includes: searchTerm,
            },
          };
        });

        params.filter = {
          $or: searchConditions,
        };
      }
    } else {
      // Fallback to original single field search
      const labelField = collectionField.targetKey || 'name' || 'title' || 'label';
      params.filter = {
        [labelField]: {
          $includes: search.trim(),
        },
      };
    }
  }

  // Association field filter
  if (collectionField.foreignKey && record?.data) {
    const sourceValue = record.data[collectionField.sourceKey];
    if (sourceValue !== undefined && sourceValue !== null) {
      if (['oho', 'o2m'].includes(collectionField.interface)) {
        params.filter = {
          ...params.filter,
          $or: [
            { [collectionField.foreignKey]: { $is: null } },
            { [collectionField.foreignKey]: { $eq: sourceValue } },
          ],
        };
      }
    }
  }

  return params;
};

// Create debounced search handler
export const createDebouncedSearch = (setDebouncedSearch: (value: string) => void, resetPage?: () => void) => {
  return debounce((value: string) => {
    setDebouncedSearch(value);
    resetPage?.();
  }, 300);
};

// Get item key for comparison
export const getItemKey = (item: any, collectionField: any) => {
  return item?.id || item?.[collectionField?.targetKey || 'id'];
};

// Check if item is selected
export const isItemSelected = (item: any, selectedItems: any[], collectionField: any): boolean => {
  const itemKey = getItemKey(item, collectionField);
  return selectedItems.some((selected) => getItemKey(selected, collectionField) === itemKey);
};

// Get fallback text for item
export const getItemFallbackText = (item: any): string => {
  return item?.name || item?.nickname || item?.username || item?.title || item?.label || item?.id || 'Unknown';
};
