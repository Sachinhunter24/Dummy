// Helper function to verify if a module belongs to the selected active category
export interface ModuleItem {
  id: string;
  name: string;
  category?: string;
  allowedCategories?: string[];
}

export const isCategoryModule = (module: ModuleItem, activeCategory: string): boolean => {
  if (!activeCategory || activeCategory === 'All' || activeCategory === 'Universal') {
    return true;
  }

  if (module.category && module.category === activeCategory) {
    return true;
  }

  if (module.allowedCategories && Array.isArray(module.allowedCategories)) {
    return module.allowedCategories.includes(activeCategory);
  }

  return false;
};

export default isCategoryModule;
