const API_KEY = 'apiKey=Wf61pNy5uzv_Q_O3BxIgWwf4aq65VXr0rQE1NPoqYFB2BmZ4';
const BASE_URL = 'https://api.currentsapi.services/v1/';
let DOMAIN;

const DEFAULT_LANG = 'language=en';

//set to 15 minutes
const TIMEOUT = 1000*60*15;
let recentSearch;
let domainsPreference={

}

const fetchJSON = (url) =>fetch(url).then(res=>res.json());

const initialFetch = () =>new Promise((res, rej)=>{
    const initialFetchArticles = localStorage.getItem('latest_news');

    const url = `https://api.currentsapi.services/v1/latest-news?&${DEFAULT_LANG}&${API_KEY}`;

    recentSearch = url;

    if (!initialFetchArticles) {
        fetchJSON(url)
        .then((news)=>{
            localStorage.setItem('latest_news', JSON.stringify({news, timestamp: Date.now(),
            }));
        console.log('Refreshed News: ', news);
        res(news);
        })
        .catch(err=>{
            console.error(err);
            rej(err);
        });
    }else{
        const {news, timestamp } = JSON.parse(localStorage.getItem('latest_news'));

        const now = Date.now();

        if (now - timestamp>TIMEOUT) {
            console.log('Updating articles');
            localStorage.removeItem('latest_news');
            initialFetch()
            .then(res)
            .catch(rej);
        }else{
            console.log('retrieving from cache');
            res(news);
        }
    }
});


function renderNews(article) {

    let {id, title, description, url, author, image, category, published} = article;

    let publishDate = new Date(published);

    if (!image || image === 'None') {
        image = './resources/generic_news_v2.jpeg';
    }

    const articleDiv = $(`<div class="card" style="width: 20rem;">
    <a href="${image}"target="_blank"><img class="card-img-top" src="${image}" alt="Card image cap"></a>
    <div class="card-body">
      <h6 class="card-text categories">${multiCategoriesElement(category)}</h6>
      <h5 class="card-title">${title}</h5>
      <h6 class="card-subtitle mb-2 text-muted">${publishDate}</h6>
      <p class="card-text">${description}</p>
      <a href="${url}" target= "_blank" class="btn btn-primary">Full Article</a>
    </div>
  </div>`);

    articleDiv.data('article', article);

    return articleDiv;
}

function multiCategoriesElement(categories){
    if (categories.length>1) {
        const catDiv = categories.map(catItem=>{
            return `<a class="category" href="${ BASE_URL }search?&category=${catItem}&${API_KEY}"><h5>${catItem}</h5></a>`;
        }).join('&#8226');

        return catDiv;
    }else{
        return `<a class="category" href="${ BASE_URL }search?&category=${categories[0]}&${API_KEY}"><h5>${categories[0]}</h5></a>`;
        
    }
}

async function fetchCategories() {

    console.log('entered fetch categories');
    const url = `https://api.currentsapi.services/v1/available/categories`;

    if (localStorage.getItem('categories')) {
        console.log('categories prepopulated');
        return JSON.parse(localStorage.getItem('categories'));
    }

    try {
        
        const response = await fetch(url)
        const { categories } = await response.json();
        console.log(categories);
       

        localStorage.setItem('categories', JSON.stringify(categories));
        console.log(categories)
        return categories;

    } catch(error){
        console.error(error);
    }

    
}

async function fetchLanguages() {

    if (localStorage.getItem('languages')) {
        console.log('languages prepopulated');
        return JSON.parse(localStorage.getItem('languages'));
    }

    try {
        const url = 'https://api.currentsapi.services/v1/available/languages';
        const response = await fetch(url)
        const { languages } = await response.json();
        localStorage.setItem('languages', JSON.stringify(languages));
        console.log(languages)
        return languages;

    } catch (error) {
        console.log(error);
    }
    
}

async function fetchRegions() {

    if (localStorage.getItem('regions')) {
        console.log('Regions prepopulated');
        return JSON.parse(localStorage.getItem('regions'));
    }

    try {
        const url = `https://api.currentsapi.services/v1/available/regions`;

        const response = await fetch(url)
        const {regions} = await response.json();

        localStorage.setItem('regions', JSON.stringify(regions));
        console.log(regions)
        return regions;

    } catch (error) {
        console.log(error);
    }
    
}

async function prefetchAllLists() {
    try {
        
        const [ categories, languages, regions] = await Promise.all([fetchCategories(), fetchLanguages(), fetchRegions()]);

        console.log('Retrieved Categories:', categories);
        categories.forEach(category=>{
            $('#categories').append(renderCategory(category, category));
        })

        console.log('Retrieved languages:', languages);
        for(let language in languages){

            $('#language').append(renderCategory(language,languages[language]));
        }
            
        console.log('Retrieved regions:', regions);
        for(let country in regions){

            $('#region').append(renderCategory(country, regions[country]));
        }
            

    } catch (error) {
        console.log(error);
    }
}

function renderCategory(name, value) {
    const newOption = $(`<option value="${value}">${name}</option>`);

    newOption.data('data', value);

    return newOption;
}

function getPreferences() {

    console.log('entered getPreferences');

    const data = localStorage.getItem('domains');
    let preferences;

    if (data) {
        preferences=JSON.parse(data);
    }else{
        return;
    }

    let domainstring='';

    
    for(let domain in preferences){
        if (preferences[domain]) {
            domainstring = domainstring + `${domain},`;

        }
    }

    console.log('User Preferences: ',domainstring);
    DOMAIN = `${domainstring}`;
    DOMAIN=DOMAIN.slice(0,DOMAIN.length-1);

    console.log('DOMAIN?', DOMAIN);
    return DOMAIN;
}

function parametersCheck(param, val){
    if (val === '') {
        return ''
    }else{
        return `&${param}=${val}`;
    }
}

function buildSearchString(){

    const parametersObject ={
        keywords: $('#keywords').val(),
        category:$('#categories').val(),
        language: $('#language').val(),
        country: $('#region').val(),
        start_date: $('#start-date').val(),
        end_date: $('#end-date').val(),
    }

    let paramsArray=[]
    for (let key in parametersObject){
        paramsArray.push(parametersCheck(key, parametersObject[key]));
    }

    let params = paramsArray.map(item=>item).join('');
    console.log(params);


    let searchString='';

    let domain;
    if (getPreferences()) {
        domain = `&domain=${getPreferences()}`;
    }else{
        domain = '';
    }
    
    searchString = `${ BASE_URL }search?${params}&${API_KEY}${domain}`;


    const encodeString = encodeURI(searchString);
    console.log('URL from buildSearchString: ', encodeString);

    return encodeString;

}

$('.search-button').on('click', async function(event){
    console.log('search button pressed');
    event.preventDefault();
    const url = buildSearchString();
    recentSearch = url;
    console.log('URL from click: ',url);
    
    onFetchStart();
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        renderPage(data);

    } catch (error) {
        console.error(error);
        
    }finally{
        onFetchEnd();
    }

})

function renderPage({news, page=null}){
    const frontPage = $('.front-page');
    frontPage.empty();
    console.log(page);

        const currentPage = recentSearch;
        console.log('Current Page: ', currentPage);

        const nextPage = `${currentPage}&page_number=${page+1}&${API_KEY}`;
        const prevPage = `${currentPage}&page_number=${page-1}&${API_KEY}`;
        const lastPage=`${currentPage}&page_number=${page+2}&${API_KEY}`;

                $('.pagination .page-item').removeClass('active');
                $('.pagination #next').attr({
                    'data': `${nextPage}`
                });
           
            if (page>1) {
                $('#prev').removeClass('disabled');
                $('.pagination #previous').attr({
                    'disabled': false,
                    'data': `${prevPage}`
                });

                $('#first-page')
                    .attr('data', `${prevPage}`)
                    .text(`${page-1}`);
                $('#current')
                    .addClass('active');
                $('#current-page')
                    .text(`${page}`);
                $('#third-page')
                    .attr('data', `${nextPage}`)
                    .text(`${page+1}`);
                $('#next').attr('data', `${nextPage}`);
            }else{

                $('.pagination #previous')
                    .attr({
                    'disabled': true,
                    'data': null
                });
                $('#prev').addClass('disabled');
                $('#first').addClass('active');
                $('#current-page').attr('data', `${nextPage}`);
                 $('#third-page').attr({
                     'data': `${lastPage}`
                 });
            }
    
    news.forEach(function(article){
        frontPage.append(renderNews(article));
    });
}

$('.page-link').on('click', async function(event){
    console.log('next/prev was clicked!');
    $('.page-item.active').removeClass('active');
    const url = $(this).attr('data');

    console.log('button url: ', url);

    try {
        const response = await fetch(url);

        const data = await response.json();

        renderPage(data);

    } catch (error) {
        console.error(error);
    }
})

$('.cards').on('click', '.category', async function(event){
    event.preventDefault();

    const href = $(this).attr('href');
    console.log('search category:', href);
    recentSearch = href;

    try {
        const response = await fetch(href);

        const data = await response.json();

        renderPage(data);

    } catch (error) {
        console.error(error);
        
    }

})

$('#start-date, #end-date').on('input', function(event){
    console.log($(this).val());
})

async function bootstrap(){
    prefetchAllLists();
    const news =await initialFetch();
    console.log('news from bootstrap: ', news);
    renderPage(news);
}

$('.hamburger').click(function(event){
        console.log('hamburger was clicked');
       $("#mySidenav").css('width',"400px");

})

$('#mySidenav .closebtn').click(function(event){
        console.log('close button was clicked');
        $("#mySidenav").css('width',"0");

            localStorage.setItem('domains', JSON.stringify(domainsPreference));

})

$('.sidebar-items').on('click', function(event){
    console.log('dropdown list clicked!');
    $('.sidebar-dropdown').toggleClass('open');
})

$('.sidebar-dropdown :checkbox').on('input', function(event){
    const checkbox = $(this);
    const name = $(this).val();
    console.log(name,' was checked');

    if (checkbox.attr('checked')) {
        checkbox.attr('checked', false);

    }else{
        checkbox.attr('checked', true);
    }

    domainsPreference[name] = checkbox.attr('checked');
})

$('.sidebar-info').on('click', function(event){
    console.log('sidebar item was clicked');

    $('#modal p').empty();
    let infoText;
    const id = $(this).attr('id');
    if (id==='about') {
        console.log('about was clicked');
        infoText = $(`<p>Search multiple news sources from one page! Search by category, publication date range, language and region. Click News Sources below to specify news-source. Or, uncheck all sources to search from hundreds of articles</p>`);
        
    }else if (id==='contact') {

        console.log('contact was clicked');
        infoText = $(`<p><a href="mailto:nowhere@somewhere.com">nowhere@somewhere.com</p>`);
    }

    $('#modal').prepend(infoText)
    $('#modal').addClass('loading');
})

function onFetchStart() {
    $('#loading').addClass('loading');
}

function onFetchEnd() {
    $('#loading').removeClass('loading');
}

$('.close-modal').click(event=>{
    $('#modal').removeClass('loading');
})
bootstrap()


