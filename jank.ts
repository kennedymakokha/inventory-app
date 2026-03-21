
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