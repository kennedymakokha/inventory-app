
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
  element.initial_stock = 50
  console.log(element)
  await createProduct(element)
}


for (let index = 0; index < arr.length; index++) {
  const element = arr[index];
  element.category_id = ""
  element.business_id = business._id
  await saveCategoryItems(db, element);

}