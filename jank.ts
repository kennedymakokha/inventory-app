
// Step 1: Create a lookup map
const categoryMap = {};
categories.forEach(cat => {
  categoryMap[cat.category_name] = cat.category_id;
});

// Step 2: Replace category name with category_id
const updatedProducts = products.map(product => ({
  ...product,
  category_id: categoryMap[product.category],
  category: undefined // optional: remove category name
}));
// Step 2: remove category name with category_id
const updatedProducts = products.map(({ category, ...rest }) => ({
  ...rest,
  category_id: categoryMap[category]
}));
console.log(updatedProducts);


// const categoryMap: any = {};
// categories.forEach(cat => {
//   categoryMap[cat.category_name] = cat.category_id;
// });

// // Step 2: Replace category name with category_id
// const updatedProducts = motobikeParts.map(({ category, ...rest }) => ({
//   ...rest,
//   category_id: categoryMap[category]
// }));
// console.log(updatedProducts)
// for (let index = 0; index < updatedProducts.length; index++) {
//   const element = updatedProducts[index];
//   element.business_id = business._id
//   element.initial_stock = 50
//   console.log(element)
//   await createProduct(element)
// }
const handleStagedProduct = async () => {
  if (saving) return;   //prevents duplicate calls
  if (!validateItem(item, setMsg)) return;

  try {
    setSaving(true);

    const categoryMap: any = {};
    categories.forEach(cat => {
      categoryMap[cat.category_name] = cat.category_id;
    });

    // Step 2: Replace category name with category_id
    const updatedProducts = motobikeParts.map(({ category, ...rest }) => ({
      ...rest,
      category_id: categoryMap[category]
    }));
    console.log(updatedProducts)
    for (let index = 0; index < updatedProducts.length; index++) {
      const element = updatedProducts[index];
      element.business_id = business._id
      await createProduct(element)
    }
    setMsg({ msg: "Product added!", state: "success" });
    setItem(initialState);
    setModalVisible(false);
    await onRefresh();

  } catch (error: any) {
    setMsg({ msg: error.message || " Error saving product.", state: "error" });
  } finally {
    setSaving(false);
  }
};
const handleStagedCategory = async () => {
  if (!validateItem(item, setMsg)) return;

  try {
    const db = await getDBConnection();
    await saveCategoryItems(db, item);
    for (let index = 0; index < arr.length; index++) {
      const element = arr[index];
      element.category_id = ""
      element.business_id = business._id
      await saveCategoryItems(db, element);
    }

    setItem(initialState);
    setModalVisible(false);
    await onRefresh();
  } catch (err: any) {
    setMsg({ msg: err.message || " Error saving category.", state: "error" });
  }
};

// for (let index = 0; index < arr.length; index++) {
//   const element = arr[index];
//   element.category_id = ""
//   element.business_id = business._id
//   await saveCategoryItems(db, element);

// }

/**
 * Converts a wholesale description into a structured inventory array
 * with a default 'units_per_package' count for system logic.
 */
const processWholesaleData = (categories) => {
  return categories.map(cat => ({
    category: cat.category_name,
    inventory: cat.description.split(/\s*,\s*/).map(product => {
      // Basic logic to guess bulk size based on common wholesale terms
      let defaultBulkSize = 12; 
      if (product.includes("25kg") || product.includes("50kg")) defaultBulkSize = 1;
      if (product.includes("Gallons") || product.includes("Jerrycans")) defaultBulkSize = 1;
      if (product.includes("Bales")) defaultBulkSize = 12;
      if (product.includes("Cartons") || product.includes("Cases")) defaultBulkSize = 24;

      return {
        product_name: product,
        units_per_package: defaultBulkSize,
        stock_level_packages: 0,
        total_individual_units: 0
      };
    })
  }));
};

const structuredWholesale = processWholesaleData(wholesaleInventory);
console.log(structuredWholesale[0].inventory[0]); 
// Output: { product_name: "25kg Sugar Sacks", units_per_package: 1, ... }