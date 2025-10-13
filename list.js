const list = document.getElementById('mathResources');

function listConverter(resources){
  return list.innerHTML = resources
  .map(resource =>
    `<li><a href="${resource.url}">${resource.name}</a></li>`
  )
  .join('');
}

export default listConverter

