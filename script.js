'use strict';
document.addEventListener('DOMContentLoaded', function () {

	let infoElem = document.querySelector(".info");

	getParamValue('XML');

	/**
	* Получение параметра из URL
	* 
	* @param {string} key 	Название искомого параметра
	*/
	function getParamValue(key) {
		const url = new URL(window.location.href),
			  paramValue = url.searchParams.get(key);

		if (paramValue) {
			const xmlNameElem = document.createElement('div');

			xmlNameElem.innerHTML = "<p>Парсим файл по адресу: <a href=\""
									+ paramValue + "\">" + paramValue + "</a></p>";
			infoElem.appendChild(xmlNameElem);

			getXML(paramValue);
		}
	}

	/**
	* Запрос XML по найденному URL
	* 
	* @param {string} path 	Путь к файлу
	*/
	function getXML(path) {
		fetch(path)
			.then(response => response.text())
			.then(xmlDoc => showXML(xmlDoc))
			.catch(error => console.log('Ошибка запроса: ', error));
	}

	/**
	* Вывод XML
	* 
	* @param {XML} xmlDoc		Содержимое полученного XML
	*/
	function showXML(xmlDoc) {
		let xmlInfoElem = document.createElement('div');

		xmlInfoElem.innerHTML = "<details>" +
									"<summary>Ответ от файла XML (нажмите, чтобы развернуть):</summary>" +
	    							"<div>" + xmlDoc + "</div>" +
								"</details>";
		infoElem.appendChild(xmlInfoElem);

		const parser = new window.DOMParser(),
			  xmlDOM = parser.parseFromString(xmlDoc, "text/xml");

		findInternalLinks(xmlDOM);
		getLettersAmountInTags(xmlDOM);
	}

	/**
	* Поиск внутренних ссылок в распарсенном XML
	* 
	* @param {DOM} xmlDOM	Распарсенный XML
	*/
	function findInternalLinks(xmlDOM) {
		let intLinksInfoElem = document.createElement('div');
		const links = xmlDOM.getElementsByTagName('a'),
			  intLinks = [];

	    for (let i=0; i < links.length; i++) {
	        if ( links[i].hasAttribute("l:href") &&
	        	 links[i].getAttribute("l:href")[0] == "#" )
	        {
	            intLinks.push(links[i]);
	        }
	    }

		intLinksInfoElem.innerHTML = "<p>Число внутренних ссылок (теги &lt;a href='#id'&gt;): <strong>" +
									 intLinks.length + "</strong></p>";
		infoElem.appendChild(intLinksInfoElem);

		findBrokenInternalLinks(xmlDOM, intLinks);
	}

	/**
	* Поиск битых ссылок в полученном массиве внутренних ссылок
	* 
	* @param {DOM} xmlDOM		Распарсенный XML
	* @param  {array} links		Полученный массив внутренних ссылок
	*/
	function findBrokenInternalLinks(xmlDOM, links) {
		let brokenLinksInfoElem = document.createElement('div');
		const brokenLinks = [];

	    for (let i=0; i < links.length; i++) {
	        const href = links[i].getAttribute("l:href").slice(1);
	        if ( xmlDOM.getElementById(href) ) continue;
            brokenLinks.push(links[i]);
	    }

		brokenLinksInfoElem.innerHTML = "<p>Число битых внутренних ссылок (ссылки на несуществующие ID элементов): " +
										"<strong>" + brokenLinks.length + "</strong></p>";

		if (brokenLinks.length > 0) {
			let brokenLinksHrefs = document.createElement('div');

		    brokenLinks.forEach(function(item) {
				brokenLinksHrefs.innerHTML += item.getAttribute("l:href") + "<br>";
			});

			brokenLinksInfoElem.innerHTML += "<details>" +
												 "<summary>Адреса битых ссылок (нажмите, чтобы развернуть):</summary>" +
												 brokenLinksHrefs.outerHTML +
											 "</details>";
		}
		
		infoElem.appendChild(brokenLinksInfoElem);
	}

	/**
	* Запуск поиска количества букв в текстах внутри тегов,
	* а также поиска количества букв в нормализованных текстах внутри тегов.
	* Вывод результатов поиска
	* 
	* @param {DOM} xmlDOM		Распарсенный XML
	*/
	function getLettersAmountInTags(xmlDOM) {
		let lettersAmountInfoElem = document.createElement('div'),
			textToParse = xmlDOM.firstElementChild.textContent;

	    const lettersAmount = calcLetters(textToParse);
	    const normLettersAmount = calcNormLetters(textToParse);

		lettersAmountInfoElem.innerHTML = "<p>Суммарное число букв внутри тегов, не включая пробельные символы<br>" +
										  " (&lt;aaa dd='ddd'&gt;text&lt;/aaa&gt; - четыре буквы): " +
										  "<strong>" + lettersAmount + "</strong></p>";

		lettersAmountInfoElem.innerHTML += "<p>Суммарное число букв нормализованного текста внутри тегов, " +
										   "включая и пробелы: " + "<strong>" + normLettersAmount +
										   "</strong></p>";
		
		infoElem.appendChild(lettersAmountInfoElem);
	}

	/**
	* Функция для подсчёта буквенных символов в переданном тексте.
	* Учитываются только буквы, символы вроде знаков препинания
	* или пробелов не учитываются!
	* На всякий случай учтены все латинские и кириллические буквы,
	* а также некоторые нестандартные
	* 
	* @param {string} text 		Переданный текст
	* @return {number} amount 	Количество буквенных символов в нём
	*/
	function calcLetters(text) {
		let amount = 0;

		text = text.replace(/[\n\r]/g, '').replace(/\s+/g, '');

		const lettersArr = text.split("");

		lettersArr.forEach(function(letter) {
			if ( letter.match( /[a-zñáéíóúüа-яёәңғүұқөһђѓєѕіїјљњћќўџґ]/i ) ) {
				amount++;
			}
		});

		return amount;
	}

	/**
	* Функция для нормализации переданного текста
	* и подсчёта буквенных символов и пробелов в нём.
	* Учитываются только буквы и пробелы,
	* символы вроде знаков препинания не учитываются!
	* 
	* @param {string} text 	Переданный текст
	* @return {number} amount 	Количество буквенных символов и пробелов в нормализованном тексте
	*/
	function calcNormLetters(text) {
		let amount = 0;

		text = text.replace(/[\n\r]/g, '');

		const lettersArr = text.split("");

		lettersArr.forEach(function(letter, i, arr) {
			if ( letter.match( /[a-záäéíñóöúüа-яёәғѓґүұқөһңђєѕіїјљњћќўџ\s]/i ) ) {
				letter = letter.normalize("NFKC");

				arr.splice(i, 1, letter);
			}
		});

		amount = lettersArr.length;

		return amount;
	}

});