'use strict';
document.addEventListener('DOMContentLoaded', async function () {
	let infoElem = document.querySelector(".info");

	try {
		const paramValue = await getParamValue('XML');
		showParamValue(paramValue);

		const xmlDoc = await getXML(paramValue);
		showXML(xmlDoc);

		const xmlDOM = await parseXML(xmlDoc);

		const internalLinks = await findInternalLinks(xmlDOM);
		showInternalLinks(internalLinks);

		const brokenInternalLinks = await findBrokenInternalLinks(xmlDOM, internalLinks);
		showBrokenInternalLinks(brokenInternalLinks);

		const lettersAmount = await getLettersAmountInTags(xmlDOM);
		showLettersAmountInTags(lettersAmount);

		const normLettersAmount = await getNormLettersAmountInTags(xmlDOM);
		showNormLettersAmountInTags(normLettersAmount);
	} catch (error) {
		alert(error);
	}

	/**
	* Получение параметра из URL
	* 
	* @param {string} key 		Название искомого параметра
	* @return {promise} 		Адрес из параметра
	*/
	function getParamValue(key) {
		return new Promise(function(resolve, reject) {
			const url = new URL(window.location.href),
				  paramValue = url.searchParams.get(key);

			if (paramValue === "") {
        		reject(new Error("В URL не указано значение параметра!"));
			} else {
				resolve(paramValue);
			}
    	});
	}

	/**
	* Вывод полученного параметра на страницу
	* 
	* @param {string} paramValue 	Полученное значение параметра
	*/
	function showParamValue(paramValue) {
		let xmlNameElem = document.createElement('div');

		xmlNameElem.innerHTML = "<p>Парсим файл по адресу: <a href=\""
								+ paramValue + "\">" + paramValue + "</a></p>";

		infoElem.appendChild(xmlNameElem);
	}

	/**
	* Запрос XML по найденному URL
	* 
	* @param {string} path 		Путь к файлу
	* @return {promise} 		Текст ответа
	*/
	async function getXML(path) {
		const response = await fetch(path);
		if(response.ok) {
			return response.text();
		}
		throw new Error('Ошибка сети (скорее всего, не найден файл)');
	}

	/**
	* Вывод полученного XML на страницу
	* 
	* @param {object} xmlDoc		Содержимое полученного XML
	*/
	function showXML(xmlDoc) {
		let xmlInfoElem = document.createElement('div');

		xmlInfoElem.innerHTML = "<details>" +
									"<summary>Ответ от файла XML (нажмите, чтобы развернуть):</summary>" +
	    							"<div>" + xmlDoc + "</div>" +
								"</details>";

		infoElem.appendChild(xmlInfoElem);
	}

	/**
	* Парсинг полученного XML в DOM
	* 
	* @param {object} xmlDoc		Содержимое полученного XML
	* @return {promise} 			Распарсенный XML
	*/
	function parseXML(xmlDoc) {
		return new Promise(function(resolve) {
			const parser = new window.DOMParser(),
				  xmlDOM = parser.parseFromString(xmlDoc, "text/xml");
			
			resolve(xmlDOM);
    	});
	}

	/**
	* Поиск внутренних ссылок в распарсенном XML
	* 
	* @param {object} xmlDOM	Распарсенный XML
	* @return {promise} 		Найденные внутренние ссылки
	*/
	function findInternalLinks(xmlDOM) {
		return new Promise(function(resolve) {
			console.log(typeof xmlDOM)
			const links = xmlDOM.getElementsByTagName('a'),
				  intLinks = [];

		    for (let i=0; i < links.length; i++) {
		        if ( links[i].hasAttribute("l:href") &&
		        	 links[i].getAttribute("l:href")[0] == "#" )
		        {
		            intLinks.push(links[i]);
		        }
		    }

			resolve(intLinks);
    	});
	}

	/**
	* Вывод количества найденных внутренних ссылок
	* 
	* @param {object} links	Найденные внутренние ссылки
	*/
	function showInternalLinks(links) {
		let intLinksInfoElem = document.createElement('div');

		intLinksInfoElem.innerHTML = "<p>Число внутренних ссылок (теги &lt;a href='#id'&gt;): <strong>" +
									 links.length + "</strong></p>";

		infoElem.appendChild(intLinksInfoElem);
	}

	/**
	* Поиск битых ссылок в полученном массиве внутренних ссылок
	* 
	* @param {object} xmlDOM		Распарсенный XML
	* @param  {object} links		Полученный массив внутренних ссылок
	* @return {promise} 			Полученные битые внутренние ссылки
	*/
	function findBrokenInternalLinks(xmlDOM, links) {
		return new Promise(function(resolve) {
			const brokenLinks = [];

		    for (let i=0; i < links.length; i++) {
		        const href = links[i].getAttribute("l:href").slice(1);
		        if ( xmlDOM.getElementById(href) ) continue;
	            brokenLinks.push(links[i]);
		    }

			resolve(brokenLinks);
    	});
	}

	/**
	* Вывод найденных битых ссылок
	* 
	* @param  {object} brokenLinks		Полученный массив битых внутренних ссылок
	*/
	function showBrokenInternalLinks(brokenLinks) {
		let brokenLinksInfoElem = document.createElement('div');

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
	* Запуск поиска количества букв в текстах внутри тегов
	* 
	* @param {object} xmlDOM		Распарсенный XML
	* @return {promise} 			Найденное количество букв
	*/
	function getLettersAmountInTags(xmlDOM) {
		return new Promise(function(resolve) {
			let textToParse = xmlDOM.firstElementChild.textContent;

		    const lettersAmount = calcLetters(textToParse);

			resolve(lettersAmount);
    	});
	}

	/**
	* Вывод результатов поиска количества букв в текстах внутри тегов
	* 
	* @param {object} lettersAmount		Найденное количество букв
	*/
	function showLettersAmountInTags(lettersAmount) {
		let lettersAmountInfoElem = document.createElement('div');

		lettersAmountInfoElem.innerHTML = "<p>Суммарное число букв внутри тегов, не включая пробельные символы<br>" +
										  " (&lt;aaa dd='ddd'&gt;text&lt;/aaa&gt; - четыре буквы): " +
										  "<strong>" + lettersAmount + "</strong></p>";
		
		infoElem.appendChild(lettersAmountInfoElem);
	}

	/**
	* Запуск поиска количества букв в нормализованных текстах внутри тегов
	* 
	* @param {DOM} xmlDOM		Распарсенный XML
	* @return {promise} 		Найденное количество букв
	*/
	function getNormLettersAmountInTags(xmlDOM) {
		return new Promise(function(resolve) {
			let textToParse = xmlDOM.firstElementChild.textContent;

		    const normLettersAmount = calcNormLetters(textToParse);

			resolve(normLettersAmount);
    	});
	}

	/**
	* Вывод результатов поиска количества букв в нормализованных текстах внутри тегов
	* 
	* @param {DOM} normLettersAmount		Найденное количество букв
	*/
	function showNormLettersAmountInTags(normLettersAmount) {
		let normLettersAmountInfoElem = document.createElement('div');

		normLettersAmountInfoElem.innerHTML += "<p>Суммарное число букв нормализованного текста внутри тегов, " +
										   "включая и пробелы: " + "<strong>" + normLettersAmount +
										   "</strong></p>";
		
		infoElem.appendChild(normLettersAmountInfoElem);
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