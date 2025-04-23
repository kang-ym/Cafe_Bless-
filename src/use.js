'use strict';

const usePage = document.querySelector('.use-container');
const closeBtn = document.querySelector('.close-btn');
const openBtn = document.querySelector('.use-btn');

closeBtn.addEventListener('click',()=>{
    usePage.style.display = 'none';
});

openBtn.addEventListener('click',()=>{
    usePage.style.display = 'block';
});