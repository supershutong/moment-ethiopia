// moment-ethiopia.js
// author: supershutong
// license: MIT
'use strict';

/************************************
	Expose Moment Ethiopia
************************************/
(function (root, factory) {
	/* global define */
	if (typeof define === 'function' && define.amd) {
		define(['moment'], function (moment) {
			root.moment = factory(moment)
			return root.moment
		})
	} else if (typeof exports === 'object') {
		module.exports = factory(require('moment/moment'))
	} else {
		root.moment = factory(root.moment)
	}
})(this, function (moment) { // jshint ignore:line

	if (moment == null) {
		throw new Error('Cannot find moment')
	}

	/************************************
	  Constants
  ************************************/

	var ethiopianCalendar = {
		// 埃塞俄比亚历法月份天数数据
		// 前12个月固定为30天，第13个月根据闰年判断为5或6天
		/**
		 * 判断埃塞俄比亚历年份是否为闰年
		 * 规则：每 4 年一个闰年，无百年/四百年例外
		 * @param {number} year - 埃塞俄比亚年份
		 * @returns {boolean} 是否为闰年
		 */
		isLeapYear: function (year) {
			// 埃历的闰年规则：每4年一个闰年，没有例外（不像公历那样有百年、四百年的特殊处理）
			return year % 4 === 0
		},
		/**
		 * 计算从元年到指定年份（不包含）之间的闰年天数
		 * 埃历的闰年规则：每4年一个闰年，没有例外（不像公历那样有百年、四百年的特殊处理）
		 * @param {number} year - 埃塞俄比亚年份（计算到 year-1 年）
		 * @returns {number} 闰年天数
		 */
		countLeapDays: function (year) {
			if (year <= 1) {
				return 0
			}
			var n = year - 1
			// 埃历的闰年规则：每4年一个闰年，没有例外
			return Math.floor(n / 4)
		},
		/**
		 * 获取指定年月的天数
		 * @param {number} year - 埃塞俄比亚年份
		 * @param {number} month - 埃塞俄比亚月份 (0-12，0 表示第 1 月，12 表示第 13 月)
		 * @returns {number} 该月的天数
		 */
		daysInMonth: function (year, month) {
			// 前12个月固定30天（0-11）
			if (month >= 0 && month <= 11) {
				return 30
			}
			// 第13个月（12）：平年5天，闰年6天
			if (month === 12) {
				return this.isLeapYear(year) ? 6 : 5
			}
			return 0
		},
		/**
		 * 获取指定年份的总天数
		 * @param {number} year - 埃塞俄比亚年份
		 * @returns {number} 该年的总天数
		 */
		daysInYear: function (year) {
			return 12 * 30 + (this.isLeapYear(year) ? 6 : 5)
		}
	}

	var formattingTokens = /(\[[^\[]*\])|(\\)?e(Mo|MM?M?M?|Do|DDDo|DD?D?D?|w[o|w]?|YYYYY|YYYY|YY|gg(ggg?)?)|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,
		localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g

		, parseTokenOneOrTwoDigits = /\d\d?/, parseTokenOneToThreeDigits = /\d{1,3}/, parseTokenThreeDigits = /\d{3}/, parseTokenFourDigits = /\d{1,4}/, parseTokenSixDigits = /[+\-]?\d{1,6}/, parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.?)|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, parseTokenT = /T/i, parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/

		, unitAliases = {
			ed: 'edate',
			em: 'emonth',
			ey: 'eyear'
		}

		, formatFunctions = {}

		, ordinalizeTokens = 'DDD w M D'.split(' '), paddedTokens = 'M D w'.split(' ')

		, formatTokenFunctions = {
			eM: function () {
				return this.eMonth() + 1
			},
			eMMM: function (format) {
				return this.localeData().eMonthsShort(this, format)
			},
			eMMMM: function (format) {
				return this.localeData().eMonths(this, format)
			},
			eD: function () {
				return this.eDate()
			},
			eDDD: function () {
				return this.eDayOfYear()
			},
			ew: function () {
				return this.eWeek()
			},
			eYY: function () {
				return leftZeroFill(this.eYear() % 100, 2)
			},
			eYYYY: function () {
				return leftZeroFill(this.eYear(), 4)
			},
			eYYYYY: function () {
				return leftZeroFill(this.eYear(), 5)
			},
			egg: function () {
				return leftZeroFill(this.eWeekYear() % 100, 2)
			},
			egggg: function () {
				return this.eWeekYear()
			},
			eggggg: function () {
				return leftZeroFill(this.eWeekYear(), 5)
			}
		}, i

	function padToken(func, count) {
		return function (a) {
			return leftZeroFill(func.call(this, a), count)
		}
	}

	function ordinalizeToken(func, period) {
		return function (a) {
			return this.localeData().ordinal(func.call(this, a), period)
		}
	}

	while (ordinalizeTokens.length) {
		i = ordinalizeTokens.pop()
		formatTokenFunctions['e' + i + 'o'] = ordinalizeToken(formatTokenFunctions['e' + i], i)
	}
	while (paddedTokens.length) {
		i = paddedTokens.pop()
		formatTokenFunctions['e' + i + i] = padToken(formatTokenFunctions['e' + i], 2)
	}
	formatTokenFunctions.eDDDD = padToken(formatTokenFunctions.eDDD, 3)

	/************************************
	  Helpers
  ************************************/

	function extend(a, b) {
		var key
		for (key in b)
			if (b.hasOwnProperty(key))
				a[key] = b[key]
		return a
	}

	function leftZeroFill(number, targetLength) { // 左补零，不使用padStart是为了兼容低版本浏览器
		var output = number + ''
		while (output.length < targetLength)
			output = '0' + output
		return output
	}

	function isArray(input) {
		return Object.prototype.toString.call(input) === '[object Array]'
	}

	function normalizeUnits(units) {
		return units ? unitAliases[units] || units.toLowerCase().replace(/(.)s$/, '$1') : units
	}

	function setDate(moment, year, month, date) {
		var utc = moment._isUTC ? 'UTC' : ''
		moment._d['set' + utc + 'FullYear'](year)
		moment._d['set' + utc + 'Month'](month)
		moment._d['set' + utc + 'Date'](date)
	}

	function objectCreate(parent) {
		function F() { }
		F.prototype = parent
		return new F()
	}

	function getPrototypeOf(object) {
		if (Object.getPrototypeOf)
			return Object.getPrototypeOf(object)
		else if (''.__proto__) // jshint ignore:line
			return object.__proto__ // jshint ignore:line
		else
			return object.constructor.prototype
	}

	/************************************
	  Languages
  ************************************/
	extend(getPrototypeOf(moment.localeData()), {
		_eMonths: ['መስከረም'
			, 'ጥቅምት'
			, 'ሕዳር'
			, 'ታኅሣሥ'
			, 'ጥር'
			, 'የካቲት'
			, 'መጋቢት'
			, 'ሚያዝያ'
			, 'ግንቦት'
			, 'ሰኔ'
			, 'ሐምሌ'
			, 'ነሐሴ'
			, 'ጳጉሜ'
		],
		eMonths: function (m) {
			// moment 的 localeData().months() 在无参时返回数组
			// 这里保持一致：无参时返回所有月份数组
			if (m == null) {
				return this._eMonths
			}
			return this._eMonths[m.eMonth()]
		},
		_eMonthsShort: ['መስከረም'
			, 'ጥቅምት'
			, 'ሕዳር'
			, 'ታኅሣሥ'
			, 'ጥር'
			, 'የካቲት'
			, 'መጋቢት'
			, 'ሚያዝያ'
			, 'ግንቦት'
			, 'ሰኔ'
			, 'ሐምሌ'
			, 'ነሐሴ'
			, 'ጳጉሜ'
		],
		eMonthsShort: function (m) {
			if (m == null) {
				return this._eMonthsShort
			}
			return this._eMonthsShort[m.eMonth()]
		},
		eMonthsParse: function (monthName) { // 获取月份名称对应月份，如 Oct ==> 10
			// 兼容阿姆哈拉语月份名的少量拼写变体（测试用例中会出现）
			// 例如：'ሕዳር' 也可能写作 'ኅዳር'
			if (monthName === 'ኅዳር') return 2
			var i, regex
			if (!this._eMonthsParse)
				this._eMonthsParse = []
			for (i = 0; i < 13; i += 1) {
				// Make the regex if we don't have it already.
				if (!this._eMonthsParse[i]) {
					// 直接使用月份名称数组构建正则表达式
					var monthFull = this._eMonths[i]
					var monthShort = this._eMonthsShort[i]
					regex = '^' + monthFull + '$|^' + monthShort + '$'
					this._eMonthsParse[i] = new RegExp(regex.replace(/\./g, ''), 'i')
				}
				// Test the regex.
				if (this._eMonthsParse[i].test(monthName))
					return i
			}
		}
	})
	// 阿姆哈拉语（Amharic）月份名称
	var eMonthNamesAm = {
		eMonths: 'መስከረም_ጥቅምት_ሕዳር_ታኅሣሥ_ጥር_የካቲት_መጋቢት_ሚያዝያ_ግንቦት_ሰኔ_ሐምሌ_ነሐሴ_ጳጉሜ'.split('_'),
		eMonthsShort: 'መስከረም_ጥቅምት_ሕዳር_ታኅሣሥ_ጥር_የካቲት_መጋቢት_ሚያዝያ_ግንቦት_ሰኔ_ሐምሌ_ነሐሴ_ጳጉሜ'.split('_')
	}

	// Default to the momentjs 2.12+ API
	if (typeof moment.updateLocale === 'function') {
		moment.updateLocale('am-et', eMonthNamesAm)
	} else {
		var oldLocale = moment.locale()
		moment.defineLocale('am-et', eMonthNamesAm)
		moment.locale(oldLocale)
	}

	/************************************
		Formatting
	************************************/

	function makeFormatFunction(format) {
		var array = format.match(formattingTokens),
			length = array.length,
			i

		for (i = 0; i < length; i += 1)
			if (formatTokenFunctions[array[i]])
				array[i] = formatTokenFunctions[array[i]]

		return function (mom) {
			var output = ''
			for (i = 0; i < length; i += 1)
				output += array[i] instanceof Function ? '[' + array[i].call(mom, format) + ']' : array[i]
			return output
		}
	}

	/************************************
		Parsing
	************************************/

	function getParseRegexForToken(token, config) {
		switch (token) {
			case 'eDDDD':
				return parseTokenThreeDigits
			case 'eYYYY':
				return parseTokenFourDigits
			case 'eYYYYY':
				return parseTokenSixDigits
			case 'eDDD':
				return parseTokenOneToThreeDigits
			case 'eMMM':
			case 'eMMMM':
				return parseTokenWord
			case 'eMM':
			case 'eDD':
			case 'eYY':
			case 'eM':
			case 'eD':
				return parseTokenOneOrTwoDigits
			case 'DDDD':
				return parseTokenThreeDigits
			case 'YYYY':
				return parseTokenFourDigits
			case 'YYYYY':
				return parseTokenSixDigits
			case 'S':
			case 'SS':
			case 'SSS':
			case 'DDD':
				return parseTokenOneToThreeDigits
			case 'MMM':
			case 'MMMM':
			case 'dd':
			case 'ddd':
			case 'dddd':
				return parseTokenWord
			case 'a':
			case 'A':
				return moment.localeData(config._l)._meridiemParse
			case 'X':
				return parseTokenTimestampMs
			case 'Z':
			case 'ZZ':
				return parseTokenTimezone
			case 'T':
				return parseTokenT
			case 'MM':
			case 'DD':
			case 'YY':
			case 'HH':
			case 'hh':
			case 'mm':
			case 'ss':
			case 'M':
			case 'D':
			case 'd':
			case 'H':
			case 'h':
			case 'm':
			case 's':
				return parseTokenOneOrTwoDigits
			default:
				return new RegExp(token.replace('\\', ''))
		}
	}

	function addTimeToArrayFromToken(token, input, config) {
		var a, datePartArray = config._a

		switch (token) {
			case 'eM':
			case 'eMM':
				datePartArray[1] = input == null ? 0 : ~~input - 1
				break
			case 'eMMM':
			case 'eMMMM':
				a = moment.localeData(config._l).eMonthsParse(input)
				if (a != null)
					datePartArray[1] = a
				else
					config._isValid = false
				break
			case 'eD':
			case 'eDD':
			case 'eDDD':
			case 'eDDDD':
				if (input != null)
					// 允许解析超出范围的日期，后续会在 dateFromArray 中验证
					datePartArray[2] = ~~input
				break
			case 'eYY':
				datePartArray[0] = ~~input + (~~input > 50 ? 1900 : 2000)
				break
			case 'eYYYY':
			case 'eYYYYY':
				datePartArray[0] = ~~input
		}
		if (input == null)
			config._isValid = false
	}

	function dateFromArray(config) {
		var g, e
		var ey = config._a[0],
			em = config._a[1],
			ed = config._a[2]

		if ((ey == null) && (em == null) && (ed == null))
			return [0, 0, 1]
		ey = ey || 0
		em = em || 0
		ed = ed || 1
		// 验证月份范围（0-based: 0-12）
		if (em < 0 || em > 12) {
			config._isValid = false
			return [0, 0, 1]
		}
		// daysInMonth 接受 0-based 月份
		if (ed < 1 || ed > ethiopianCalendar.daysInMonth(ey, em)) {
			config._isValid = false
			return [0, 0, 1]
		}
		// em 为 0-based，ethiopiaToGregorian 也接受 0-based
		g = ethiopiaToGregorian(ey, em, ed)
		if (g == null) {
			config._isValid = false
			return [0, 0, 1]
		}
		e = gregorianToEthiopia(g.year, g.month, g.day)
		if (e == null) {
			config._isValid = false
			return [0, 0, 1]
		}
		config._eDiff = 0
		if (~~e.year !== ey)
			config._eDiff += 1
		if (~~e.month !== em)
			config._eDiff += 1
		if (~~e.day !== ed)
			config._eDiff += 1
		// g.month 已经是 0-based，直接返回
		return [g.year, g.month, g.day]
	}

	function makeDateFromStringAndFormat(config) {
		var tokens = config._f.match(formattingTokens),
			string = config._i,
			len = tokens.length,
			i, token, parsedInput

		config._a = []

		for (i = 0; i < len; i += 1) {
			token = tokens[i]
			parsedInput = (getParseRegexForToken(token, config).exec(string) || [])[0];
			if (parsedInput)
				string = string.slice(string.indexOf(parsedInput) + parsedInput.length)
			if (formatTokenFunctions[token])
				addTimeToArrayFromToken(token, parsedInput, config)
		}
		if (string)
			config._il = string

		return dateFromArray(config)
	}

	function makeDateFromStringAndArray(config, utc) {
		var len = config._f.length
			, i
			, format
			, tempMoment
			, bestMoment
			, currentScore
			, scoreToBeat

		if (len === 0) {
			return makeMoment(new Date(NaN))
		}

		for (i = 0; i < len; i += 1) {
			format = config._f[i]
			currentScore = 0
			tempMoment = makeMoment(config._i, format, config._l, config._strict, utc)

			if (!tempMoment.isValid()) continue

			currentScore += tempMoment._eDiff || 0
			if (tempMoment._il)
				currentScore += tempMoment._il.length
			if (scoreToBeat == null || currentScore < scoreToBeat) {
				scoreToBeat = currentScore
				bestMoment = tempMoment
			}
		}

		return bestMoment
	}

	function removeParsedTokens(config) {
		var string = config._i,
			input = '',
			format = '',
			array = config._f.match(formattingTokens),
			len = array.length,
			i, match, parsed

		for (i = 0; i < len; i += 1) {
			match = array[i]
			parsed = (getParseRegexForToken(match, config).exec(string) || [])[0]
			if (parsed)
				string = string.slice(string.indexOf(parsed) + parsed.length)
			if (!(formatTokenFunctions[match] instanceof Function)) {
				format += match
				if (parsed)
					input += parsed
			}
		}
		config._i = input
		config._f = format
	}

	/************************************
	  Week of Year in Ethiopia Calendar
	************************************/

	function eWeekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
		var end = firstDayOfWeekOfYear - firstDayOfWeek
		var daysToDayOfWeek = firstDayOfWeekOfYear - mom.day()
		var adjustedMoment

		if (daysToDayOfWeek > end) {
			daysToDayOfWeek -= 7
		}
		if (daysToDayOfWeek < end - 7) {
			daysToDayOfWeek += 7
		}
		// 在埃历空间中对齐到包含埃历年第一周的那一周
		adjustedMoment = eMoment(mom).add(daysToDayOfWeek, 'd')
		return {
			week: Math.ceil(adjustedMoment.eDayOfYear() / 7),
			year: adjustedMoment.eYear()
		}
	}

	/************************************
	  Top Level Functions (Ethiopia Moment)
	  ************************************/

	function makeMoment(input, format, lang, strict, utc) {
		// 先从“原始 format 参数”判断是否为埃历（后续会对 format 做拼接/裁剪）
		var originalFormat = format
		var hasEthiopiaToken = false
		if (originalFormat) {
			if (isArray(originalFormat)) {
				for (var ofi = 0; ofi < originalFormat.length; ofi += 1) {
					if (typeof originalFormat[ofi] === 'string' && /e[YyMDdWw]/.test(originalFormat[ofi])) {
						hasEthiopiaToken = true
						break
					}
				}
			} else if (typeof originalFormat === 'string' && /e[YyMDdWw]/.test(originalFormat)) {
				hasEthiopiaToken = true
			}
		}
		// 构造与 moment-hijri/moment-jalaali 一致的配置对象，便于后续扩展/解析
		var config =
		{
			_i: input
			, _f: format
			, _l: lang
			, _strict: strict
			, _isUTC: utc
		}
			, date
			, m
			, em
		if (format) {
			if (isArray(format)) {
				return makeDateFromStringAndArray(config, utc)
			} else {
				date = makeDateFromStringAndFormat(config)
				removeParsedTokens(config)
				format = 'YYYY-MM-DD-' + config._f
				input = leftZeroFill(date[0], 4) + '-'
					+ leftZeroFill(date[1] + 1, 2) + '-'
					+ leftZeroFill(date[2], 2) + '-'
					+ config._i
			}
		}
		if (utc)
			m = moment.utc(input, format, lang, strict)
		else
			m = moment(input, format, lang, strict)
		// 如果日期无效，设置 moment 对象为无效状态
		if (config._isValid === false) {
			m._isValid = false
			// 确保 moment 对象被标记为无效日期
			m._d = new Date(NaN)
		}
		m._eDiff = config._eDiff || 0
		em = objectCreate(eMoment.fn)
		extend(em, m)
		// 标记该实例的历法系统（moment() 本身并不会保留 config，因此在这里补上标记）
		if (hasEthiopiaToken) {
			em._calendarType = 'ethiopia'
		}
		// 确保无效状态被正确传递
		if (config._isValid === false) {
			em._isValid = false
			em._d = new Date(NaN)
		}
		return em
	}

	function eMoment(input, format, lang, strict) {
		return makeMoment(input, format, lang, strict, false)
	}

	extend(eMoment, moment)
	eMoment.fn = objectCreate(moment.fn)

	eMoment.utc = function (input, format, lang, strict) {
		return makeMoment(input, format, lang, strict, true)
	}

	/************************************
	  Moment Prototype Extensions (on eMoment)
	  ************************************/

	eMoment.fn.format = function (format) {
		var i, replace, me = this

		if (format) {
			i = 5
			replace = function (input) {
				return me.localeData().longDateFormat(input) || input
			}
			while (i > 0 && localFormattingTokens.test(format)) {
				i -= 1
				format = format.replace(localFormattingTokens, replace)
			}
			if (!formatFunctions[format]) {
				formatFunctions[format] = makeFormatFunction(format)
			}
			format = formatFunctions[format](this)
		}
		return moment.fn.format.call(this, format)
	}

		// 读取 / 设置埃塞俄比亚年
	eMoment.fn.eYear = function (input) {
		// getter：从当前公历日期转换得到埃历年
		var gYear = this.year()
		var gMonth = this.month() // 0-based，gregorianToEthiopia 接受 0-based
		var gDate = this.date()
		var eth = gregorianToEthiopia(gYear, gMonth, gDate)

		if (eth == null) {
			return NaN
		}

		if (input == null) {
			return eth.year
		}

		// setter：保留当前埃历月/日，只修改埃历年，再回写到底层公历 Date
		// 验证日期是否有效
		var maxDay = ethiopianCalendar.daysInMonth(input, eth.month)
		if (eth.day > maxDay) {
			// 日期超出范围，标记为无效
			this._isValid = false
			this._d = new Date(NaN)
			return this
		}
		var target = ethiopiaToGregorian(input, eth.month, eth.day)
		if (target == null) {
			// 转换失败，标记为无效
			this._isValid = false
			this._d = new Date(NaN)
			return this
		}
		// ethiopiaToGregorian 返回 0-based 公历月份
		setDate(this, target.year, target.month, target.day)
		return this
	}

	// 读取 / 设置埃塞俄比亚月（0-12，对应 1-13 月）
	eMoment.fn.eMonth = function (input) {
		var gYear = this.year()
		var gMonth = this.month()
		var gDate = this.date()
		var eth = gregorianToEthiopia(gYear, gMonth, gDate)

		if (eth == null) {
			return NaN
		}

		if (input == null) {
			// 与 moment 的 month() 一致：返回 0-12
			return eth.month
		}

		var newMonth
		var newYear = eth.year

		// 允许通过月份名称（完整或缩写）设置月份：与 moment-hijri/moment-jalaali 风格一致
		if (typeof input === 'string') {
			var localeData = this.localeData()
			var idx = -1
			// 优先使用 locale 的 parse 方法（支持别名/大小写/变体）
			if (localeData.eMonthsParse) {
				idx = localeData.eMonthsParse(input)
			}
			// 兼容：退化到数组 indexOf（无 parse 时）
			if (idx == null || idx === -1) {
				var months = localeData.eMonths ? localeData.eMonths() : []
				var monthsShort = localeData.eMonthsShort ? localeData.eMonthsShort() : []
				idx = months.indexOf(input)
				if (idx === -1) {
					idx = monthsShort.indexOf(input)
				}
			}
			if (idx === -1) {
				return this // 未找到匹配的月份名称，保持不变
			}
			newMonth = idx
		} else {
			// setter：数字 input 支持溢出（add/subtract 会传入 -n 或 >12）
			newMonth = +input
		}

		// 数字月份：进行 13 个月制的进位/借位归一化到 [0, 12]
		if (typeof input !== 'string') {
			if (!isFinite(newMonth)) {
				this._isValid = false
				this._d = new Date(NaN)
				return this
			}
			// (eth.year - 1) * 13 + newMonth => 0-based month index from year 1
			var totalMonths = (eth.year - 1) * 13 + newMonth
			newYear = Math.floor(totalMonths / 13) + 1
			newMonth = totalMonths % 13
			if (newMonth < 0) {
				newMonth += 13
				newYear -= 1
			}
		}

		// 与 moment 的 month() 行为一致：如果日期超出目标月份，则 clamp 到该月最后一天
		var maxDay = ethiopianCalendar.daysInMonth(newYear, newMonth)
		var day = eth.day > maxDay ? maxDay : eth.day
		var target = ethiopiaToGregorian(newYear, newMonth, day)
		if (target == null) {
			// 转换失败，标记为无效
			this._isValid = false
			this._d = new Date(NaN)
			return this
		}
		setDate(this, target.year, target.month, target.day)
		return this
	}

	// 读取 / 设置埃塞俄比亚日
	eMoment.fn.eDate = function (input) {
		var gYear = this.year()
		var gMonth = this.month()
		var gDate = this.date()
		var eth = gregorianToEthiopia(gYear, gMonth, gDate)

		if (eth == null) {
			return NaN
		}

		if (input == null) {
			return eth.day
		}

		var newDate = +input
		if (!isFinite(newDate)) {
			this._isValid = false
			this._d = new Date(NaN)
			return this
		}

		// 与 moment 的 date() 行为一致：允许溢出进位/借位（31 -> 下月 1）
		// 先以当月 1 日为基准，通过 JDN 加偏移，然后再 d2e 归一化
		var jdn = e2d(eth.year, eth.month, 1) + (newDate - 1)
		var normalized = d2e(jdn)
		var target = ethiopiaToGregorian(normalized.year, normalized.month, normalized.day)
		if (target == null) {
			// 转换失败，标记为无效
			this._isValid = false
			this._d = new Date(NaN)
			return this
		}
		setDate(this, target.year, target.month, target.day)
		return this
	}

	eMoment.fn.eDayOfYear = function (input) {
		var gYear = this.year()
		var gMonth = this.month()
		var gDate = this.date()
		var eth = gregorianToEthiopia(gYear, gMonth, gDate)

		if (eth == null) {
			return NaN
		}

		var dayOfYear = eth.month * 30 + eth.day // 1-365/366

		if (input == null) {
			return dayOfYear
		}

		var newDayOfYear = +input
		if (!isFinite(newDayOfYear)) {
			this._isValid = false
			this._d = new Date(NaN)
			return this
		}

		// 与 moment 的 dayOfYear() 行为一致：允许跨年溢出
		var jdn = e2d(eth.year, 0, 1) + (newDayOfYear - 1)
		var normalized = d2e(jdn)
		var target = ethiopiaToGregorian(normalized.year, normalized.month, normalized.day)
		if (target == null) {
			// 转换失败，标记为无效
			this._isValid = false
			this._d = new Date(NaN)
			return this
		}
		setDate(this, target.year, target.month, target.day)
		return this
	}

	eMoment.fn.eWeek = function (input) {
		var localeData = this.localeData()
		var week = eWeekOfYear(this, localeData._week.dow, localeData._week.doy).week
		return input == null ? week : this.add((input - week) * 7, 'd')
	}

	eMoment.fn.eWeekYear = function (input) {
		var localeData = this.localeData()
		var yearInfo = eWeekOfYear(this, localeData._week.dow, localeData._week.doy)
		var year = yearInfo.year
		return input == null ? year : this.add(input - year, 'y')
	}

	// 返回当前埃塞俄比亚月的天数
	eMoment.fn.eDaysInMonth = function () {
		var gYear = this.year()
		var gMonth = this.month()
		var gDate = this.date()
		var eth = gregorianToEthiopia(gYear, gMonth, gDate)

		if (eth == null) {
			return NaN
		}

		// 使用 ethiopianCalendar 常量获取月份天数
		return ethiopianCalendar.daysInMonth(eth.year, eth.month)
	}

	var oldAdd = moment.fn.add
	eMoment.fn.add = function (val, units) {
		// 支持 moment 兼容写法：add('eyear', 1)
		var temp
		if (units !== null && !isNaN(+units)) {
			temp = val
			val = units
			units = temp
		}
		units = normalizeUnits(units)
		if (units === 'eyear') {
			this.eYear(this.eYear() + val)
		} else if (units === 'emonth') {
			this.eMonth(this.eMonth() + val)
		} else if (units === 'eday' || units === 'edate') {
			this.eDate(this.eDate() + val)
		} else {
			oldAdd.call(this, val, units)
		}
		return this
	}

	var oldSubtract = moment.fn.subtract
	eMoment.fn.subtract = function (val, units) {
		units = normalizeUnits(units)
		if (units === 'edate' || units === 'eday' || units === 'emonth' || units === 'eyear') {
			// 直接复用 add 逻辑
			return this.add(-val, units)
		}
		return oldSubtract.call(this, val, units)
	}

	var oldStartOf = moment.fn.startOf
	eMoment.fn.startOf = function (units) {
		units = normalizeUnits(units)
		if (units === 'emonth' || units === 'eyear') {
			var gYear = this.year()
			var gMonth = this.month()
			var gDate = this.date()
			var eth = gregorianToEthiopia(gYear, gMonth, gDate)

			if (eth == null) {
				return this
			}

			if (units === 'emonth') {
				var startMonth = eth.month
				var target = ethiopiaToGregorian(eth.year, startMonth, 1)
				if (target == null) {
					return this
				}
				setDate(this, target.year, target.month, target.day)
				this.startOf('day')
				return this
			}

			if (units === 'eyear') {
				// 0 表示第 1 月（0-based）
				var target2 = ethiopiaToGregorian(eth.year, 0, 1)
				if (target2 == null) {
					return this
				}
				setDate(this, target2.year, target2.month, target2.day)
				this.startOf('day')
				return this
			}
		}
		return oldStartOf.call(this, units)
	}

	var oldEndOf = moment.fn.endOf
	eMoment.fn.endOf = function (units) {
		units = normalizeUnits(units)
		if (units === 'emonth' || units === 'eyear') {
			var gYear = this.year()
			var gMonth = this.month()
			var gDate = this.date()
			var eth = gregorianToEthiopia(gYear, gMonth, gDate)

			if (eth == null) {
				return this
			}

			if (units === 'emonth') {
				// 使用 ethiopianCalendar 常量获取准确的月份最后一天（接受 0-based）
				var lastDay = ethiopianCalendar.daysInMonth(eth.year, eth.month)
				var target = ethiopiaToGregorian(eth.year, eth.month, lastDay)
				if (target == null) {
					return this
				}
				setDate(this, target.year, target.month, target.day)
				this.endOf('day')
				return this
			}

			if (units === 'eyear') {
				// 年末在第 13 月（0-based 为 12），使用准确的闰年判断
				var lastDayOfYear = ethiopianCalendar.daysInMonth(eth.year, 12)
				var target2 = ethiopiaToGregorian(eth.year, 12, lastDayOfYear)
				if (target2 == null) {
					return this
				}
				setDate(this, target2.year, target2.month, target2.day)
				this.endOf('day')
				return this
			}
		}
		return oldEndOf.call(this, units)
	}

	eMoment.fn.clone = function () {
		return eMoment(this)
	}

	// alias
	eMoment.fn.eYears = eMoment.fn.eYear
	eMoment.fn.eMonths = eMoment.fn.eMonth
	eMoment.fn.eDates = eMoment.fn.eDate
	eMoment.fn.eWeeks = eMoment.fn.eWeek

	/************************************
	  eConvert API eMoment的静态方法
	  ************************************/
	eMoment.eDaysInMonth = function () {
		var gYear = this.year()
		var gMonth = this.month()
		var gDate = this.date()
		var eth = gregorianToEthiopia(gYear, gMonth, gDate)

		if (eth == null) {
			return NaN
		}

		// 使用 ethiopianCalendar 常量获取月份天数（接受 0-based）
		return ethiopianCalendar.daysInMonth(eth.year, eth.month)
	}
	/**
	 * Convert Gregorian date to Ethiopia date
	 * @param {number} gy - Gregorian year
	 * @param {number} gm - Gregorian month (1-12)
	 * @param {number} gd - Gregorian day
	 * @returns {Object|null} {ey: number, em: number, ed: number} - Ethiopia year, month (0-12), day, or null if invalid
	 */
	function toEthiopia(gy, gm, gd) {
		// 对外仍然接受 1-12 公历月份，这里转换为 0-based
		var result = gregorianToEthiopia(gy, gm - 1, gd)
		if (result == null) {
			return null
		}
		return {
			ey: result.year,
			// 对外暴露 0-12 的埃历月份（与 hijri 的 hm 对齐，gregorianToEthiopia 已返回 0-based）
			em: result.month,
			ed: result.day
		}
	}
	/**
	 * Convert Ethiopia date to Gregorian date
	 * @param {number} ey - Ethiopia year
	 * @param {number} em - Ethiopia month (0-12)
	 * @param {number} ed - Ethiopia day
	 * @returns {Object|null} {gy: number, gm: number, gd: number} - Gregorian year, month (1-12), day, or null if invalid
	 */
	function toGregorian(ey, em, ed) {
		// 对外接受 0-12 的埃历月份，ethiopiaToGregorian 也接受 0-based
		var result = ethiopiaToGregorian(ey, em, ed)
		if (result == null) {
			return null
		}
		return {
			gy: result.year,
			// 将 0-based 月份转换为 1-based 返回
			gm: result.month + 1,
			gd: result.day
		}
	}
	// eConvert provides static methods for converting between Gregorian and Ethiopia calendars
	eMoment.eConvert = {
		toEthiopia,
		toGregorian,
	}

	/************************************
		Ethiopia Conversion
	************************************/

	/*
		Utility helper functions.
	*/

	function div(a, b) {
		return~~ (a / b)
	}

	function mod(a, b) {
		return a - ~~(a / b) * b
	}

	/************************************
		Ethiopia Calendar Conversion Functions
	************************************/

	// 1724220.5 表示埃塞俄比亚历法元年 1 月 1 日午夜 00:00 对应的儒略日数（JDN）
	// 对应公历公元8年8月29日（儒略历）的午夜
	var ETHIOPIAN_EPOCH = 1724220.5 // JDN for Ethiopia 0001-01-01 (midnight)

	// 缓存机制：缓存所有年份到年初天数的映射，提升性能
	// 由于年份数量有限且计算成本较高，采用全部缓存策略
	var yearCache = {
		_cache: {},
		_lastYear: null,
		_lastDays: null,
		/**
		 * 获取指定年份年初的天数（从元年开始）
		 * @param {number} year - 埃塞俄比亚年份
		 * @returns {number} 到该年年初的天数
		 */
		getDaysToYearStart: function (year) {
			// 检查缓存
			if (this._cache[year] != null) {
				return this._cache[year]
			}

			// 如果请求的年份接近上次查询的年份，可以利用上次的结果并缓存所有中间年份
			if (this._lastYear != null) {
				var diff = year - this._lastYear
				if (diff > 0 && diff <= 1000) {
					// 向前计算，缓存所有中间年份
					var days = this._lastDays
					for (var y = this._lastYear; y < year; y++) {
						days += ethiopianCalendar.daysInYear(y)
						// 缓存所有中间年份
						this._cache[y + 1] = days
					}
					this._lastYear = year
					this._lastDays = days
					return days
				} else if (diff < 0 && Math.abs(diff) <= 1000) {
					// 向后计算，缓存所有中间年份
					var days = this._lastDays
					for (var y = this._lastYear - 1; y >= year; y--) {
						days -= ethiopianCalendar.daysInYear(y)
						// 缓存所有中间年份
						this._cache[y] = days
					}
					this._lastYear = year
					this._lastDays = days
					return days
				}
			}

			// 直接计算（当无法利用上次结果时）
			var leapDays = ethiopianCalendar.countLeapDays(year)
			var days = (year - 1) * 365 + leapDays
			this._cache[year] = days
			this._lastYear = year
			this._lastDays = days
			return days
		},
		/**
		 * 清空缓存
		 */
		clear: function () {
			this._cache = {}
			this._lastYear = null
			this._lastDays = null
		},
		/**
		 * 获取缓存统计信息（用于调试）
		 * @returns {Object} 缓存统计
		 */
		getStats: function () {
			var keys = Object.keys(this._cache)
			var sortedKeys = keys.map(function (k) { return parseInt(k, 10) }).sort(function (a, b) { return a - b })
			return {
				count: keys.length,
				minYear: sortedKeys.length > 0 ? sortedKeys[0] : null,
				maxYear: sortedKeys.length > 0 ? sortedKeys[sortedKeys.length - 1] : null,
				lastYear: this._lastYear
			}
		}
	}

	function e2d(year, month, day) {
		// 使用公共方法计算闰年天数
		// month 为 0-based（0-12，0 表示第 1 月，12 表示第 13 月）
		var leapDays = ethiopianCalendar.countLeapDays(year)
		return ETHIOPIAN_EPOCH +
			(year - 1) * 365 +
			leapDays +
			month * 30 +
			day - 1
	}

	function d2e(jdn) {
		// 计算从埃历元年1月1日到目标日期的天数
		// 使用 Math.floor(jdn - ETHIOPIAN_EPOCH) 确保 r 是整数
		// 注意：e2d 返回的 JDN 是浮点数（因为 ETHIOPIAN_EPOCH = 1724220.5），
		// 但这里我们需要的是整数天数，所以直接取整
		var r = Math.floor(jdn - ETHIOPIAN_EPOCH)

		// 使用二分查找找到正确的年份，提升性能
		// 先估算年份范围（使用平均年长度 365.2425 天）
		var estimatedYear = Math.floor(r / 365.2425) + 1

		// 二分查找的边界
		var lowYear = Math.max(1, estimatedYear - 10)
		var highYear = estimatedYear + 10
		var ethYear = estimatedYear
		var daysToYearStart = 0

		// 使用二分查找优化年份查找
		while (lowYear <= highYear) {
			ethYear = Math.floor((lowYear + highYear) / 2)
			daysToYearStart = yearCache.getDaysToYearStart(ethYear)
			var daysInYear = ethiopianCalendar.daysInYear(ethYear)

			if (r >= daysToYearStart && r < daysToYearStart + daysInYear) {
				// 找到了正确的年份
				break
			} else if (r < daysToYearStart) {
				// 年份太大，缩小上界
				highYear = ethYear - 1
			} else {
				// 年份太小，增大下界
				lowYear = ethYear + 1
			}
		}

		// 如果二分查找失败，使用线性搜索（通常不会发生）
		if (lowYear > highYear) {
			// 回退到线性搜索
			ethYear = estimatedYear
			var maxIterations = 20
			for (var i = 0; i < maxIterations; i++) {
				daysToYearStart = yearCache.getDaysToYearStart(ethYear)
				var daysInYear = ethiopianCalendar.daysInYear(ethYear)
				if (r >= daysToYearStart && r < daysToYearStart + daysInYear) {
					break
				} else if (r < daysToYearStart) {
					ethYear--
				} else {
					ethYear++
				}
			}
			daysToYearStart = yearCache.getDaysToYearStart(ethYear)
		}

		// 计算埃历年内的天数（从1开始）
		var dayOfYear = r - daysToYearStart + 1

		// 计算埃历月（返回 0-based，0-12）
		// 前12个月每月30天，共360天
		var ethMonth, ethDay
		if (dayOfYear <= 360) {
			ethMonth = Math.floor((dayOfYear - 1) / 30)
			ethDay = ((dayOfYear - 1) % 30) + 1
		} else {
			// 第13个月（0-based 为 12）
			ethMonth = 12
			ethDay = dayOfYear - 360
			// 确保不超过该月的最大天数（daysInMonth 接受 0-based）
			var maxDay = ethiopianCalendar.daysInMonth(ethYear, 12)
			if (ethDay > maxDay) {
				ethDay = maxDay
			}
		}

		return { year: ethYear, month: ethMonth, day: ethDay }
	}

	function g2d(year, month, day) {
		var a = Math.floor((14 - month) / 12)
		var y = year + 4800 - a
		var m = month + 12 * a - 3
		return day +
			Math.floor((153 * m + 2) / 5) +
			365 * y + Math.floor(y / 4) -
			Math.floor(y / 100) + Math.floor(y / 400) - 32045
	}

	function d2g(jdn) {
		var j = Math.floor(jdn + 0.5)
		var f = jdn + 0.5 - j
		var b = Math.floor((j - 1867216.25) / 36524.25)
		var c = j + b - Math.floor(b / 4) + 1524
		var d = Math.floor((c - 122.1) / 365.25)
		var e = Math.floor(365.25 * d)
		var g = Math.floor((c - e) / 30.6001)
		var day = c - e + f - Math.floor(30.6001 * g)
		var month = g < 13.5 ? g - 1 : g - 13
		var year = month < 2.5 ? d - 4715 : d - 4716
		return { year: year, month: month, day: Math.floor(day) }
	}

	// 公历↔埃历的辅助转换函数
	// 约定：
	// - 公历 month 使用 0-based（与 moment 一致，0-11）
	// - 埃历 month 使用 0-based（与 moment 一致，0-12 对应 1-13 月）
	// - 底层算法函数（e2d/d2e/daysInMonth）统一使用 0-based
	
	/**
	 * 计算公历指定年月的天数
	 * @param {number} year - 公历年份
	 * @param {number} month - 公历月份 (0-based, 0-11)
	 * @returns {number} 该月的天数
	 */
	function gregorianDaysInMonth(year, month) {
		// 月份越界
		if (month < 0 || month > 11) {
			return 0
		}
		// 31天的月份：1,3,5,7,8,10,12 月（0-based: 0,2,4,6,7,9,11）
		if ([0, 2, 4, 6, 7, 9, 11].indexOf(month) !== -1) {
			return 31
		}
		// 30天的月份：4,6,9,11 月（0-based: 3,5,8,10）
		if ([3, 5, 8, 10].indexOf(month) !== -1) {
			return 30
		}
		// 2月（month === 1）：需要判断闰年
		// 公历闰年规则：能被4整除但不能被100整除，或能被400整除
		var isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
		return isLeap ? 29 : 28
	}
	
	function gregorianToEthiopia(year, month, day) {
		// 验证输入参数
		if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number' ||
			!isFinite(year) || !isFinite(month) || !isFinite(day)) {
			return null
		}
		// 验证月份范围（0-based: 0-11）
		if (month < 0 || month > 11) {
			return null
		}
		// 验证日期范围
		var maxDay = gregorianDaysInMonth(year, month)
		if (day < 1 || day > maxDay) {
			return null
		}
		// g2d 期望 1-based 月份，这里将 0-based 转为 1-based
		var jdn = g2d(year, month + 1, day)
		// d2e 返回 0-based 埃历月份（0-12），直接使用
		return d2e(jdn)
	}

	function ethiopiaToGregorian(year, month, day) {
		// 验证输入参数
		if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number' ||
			!isFinite(year) || !isFinite(month) || !isFinite(day)) {
			return null
		}
		// 验证月份范围（0-based: 0-12）
		if (month < 0 || month > 12) {
			return null
		}
		// 验证日期范围
		var maxDay = ethiopianCalendar.daysInMonth(year, month)
		if (day < 1 || day > maxDay) {
			return null
		}
		// e2d 接受 0-based 埃历月份（0-12），直接使用
		var jdn = e2d(year, month, day)
		// 补偿 JDN 半日基准差，避免埃历 -> 公历转换少一天
		var g = d2g(jdn + 1)
		// d2g 返回 1-based 月份，这里转为 0-based 与 moment 对齐
		g.month -= 1
		return g
	}

	/************************************
	  Parsing
  ************************************/

	var oldParse = moment.fn.parse
	// todo: 此处修改原生方法会污染全局，考虑移除
	moment.fn.parse = function (config) {
		// 这里预留埃塞俄比亚历解析扩展点：
		// 设计目标：
		// - 仅当 format 中显式出现 e 前缀标记（eYYYY/eMM/eDD/...）时，
		//   才启用埃历解析逻辑；
		// - 否则完全走原生 moment 的解析流程。

		var format = config._f
		var input = config._i

		// 检查格式字符串或格式数组中是否包含 e 前缀标记
		var hasEthiopiaFormat = false
		if (format) {
			if (isArray(format)) {
				// 支持格式数组：只要有一个格式包含 e 前缀标记，就启用埃历解析
				for (var i = 0; i < format.length; i++) {
					if (typeof format[i] === 'string' && /e[YyMDdWw]/.test(format[i])) {
						hasEthiopiaFormat = true
						break
					}
				}
			} else if (typeof format === 'string' && /e[YyMDdWw]/.test(format)) {
				hasEthiopiaFormat = true
			}
		}

		// 如果包含 e 前缀格式标记，尝试使用埃历解析
		if (hasEthiopiaFormat && input != null) {
			var result = parseEthiopia.call(this, input, format, config._locale, config._strict)
			if (result) {
				// 解析成功，设置 _calendarType 标记
				this._calendarType = 'ethiopia'
				return this
			}
			// 如果埃历解析失败，继续走原生 moment 解析流程
		}

		return oldParse.call(this, config)
	}

	function parseEthiopia(input, format, locale, strict) {
		// 基于 e 前缀标记的解析逻辑
		// 设计要求：
		// - 必须显式使用 e 前缀格式；
		// - 不做自动历法猜测；
		// - 支持与公历标记混合的复杂格式；
		// - 支持格式数组。

		if (!input || !format) {
			return false
		}

		// 将输入转换为字符串（如果不是字符串）
		if (typeof input !== 'string') {
			if (typeof input === 'number' || input instanceof Date) {
				// 数字或日期对象，不支持直接解析为埃历
				return false
			}
			input = String(input)
		}

		// 支持格式数组：尝试每个格式直到成功
		if (isArray(format)) {
			for (var i = 0; i < format.length; i++) {
				var result = parseEthiopia.call(this, input, format[i], locale, strict)
				if (result) {
					return result
				}
			}
			return false
		}

		if (typeof format !== 'string') {
			return false
		}

		// 检查格式中是否真的包含 e 前缀标记
		if (!/e[YyMDdWw]/.test(format)) {
			return false
		}

		// 解析格式字符串，提取埃历的年、月、日等信息
		var ethYear = null
		var ethMonth = null
		var ethDay = null
		var parsed = {}

		// 使用正则表达式匹配格式标记
		var tokens = []
		var tokenMatch
		formattingTokens.lastIndex = 0
		while ((tokenMatch = formattingTokens.exec(format)) !== null) {
			tokens.push(tokenMatch[0])
		}

		if (tokens.length === 0) {
			return false
		}

		var inputIndex = 0

		// 遍历格式标记，解析输入字符串
		for (var j = 0; j < tokens.length; j++) {
			var token = tokens[j]

			// 跳过转义字符和字面量
			if (token[0] === '[' && token[token.length - 1] === ']') {
				// 字面量：直接匹配
				var literal = token.slice(1, -1)
				if (input.substr(inputIndex, literal.length) === literal) {
					inputIndex += literal.length
					continue
				} else {
					return false
				}
			}

			if (token[0] === '\\' && token.length > 1) {
				// 转义字符：跳过反斜杠，匹配下一个字符
				var escaped = token[1]
				if (input[inputIndex] === escaped) {
					inputIndex += 1
					continue
				} else {
					return false
				}
			}

			// 处理 e 前缀标记
			if (token[0] === 'e') {
				var tokenType = token.substring(1)
				var match = null
				var value = null

				// 匹配不同类型的标记
				if (tokenType === 'YYYY' || tokenType === 'YYYYY') {
					match = input.substr(inputIndex).match(/^\d{4,5}/)
					if (match) {
						value = parseInt(match[0], 10)
						ethYear = value
						inputIndex += match[0].length
						continue
					}
				} else if (tokenType === 'YY') {
					match = input.substr(inputIndex).match(/^\d{2}/)
					if (match) {
						value = parseInt(match[0], 10)
						// 将 2 位年份转换为 4 位年份（假设 00-99 表示 2000-2099）
						ethYear = value < 50 ? 2000 + value : 1900 + value
						inputIndex += match[0].length
						continue
					}
				} else if (tokenType === 'MM' || tokenType === 'M') {
					match = input.substr(inputIndex).match(/^\d{1,2}/)
					if (match) {
						value = parseInt(match[0], 10)
						if (value >= 1 && value <= 13) {
							// 用户输入 1-13，转为 0-based（0-12）
							ethMonth = value - 1
							inputIndex += match[0].length
							continue
						}
					}
				} else if (tokenType === 'MMMM' || tokenType === 'MMM') {
					// 月份名称：尝试匹配本地化的月份名称
					var localeData = locale ? moment.localeData(locale) : moment.localeData()
					var months = localeData.eMonths ? localeData.eMonths() : []
					var monthsShort = localeData.eMonthsShort ? localeData.eMonthsShort() : []

					var matched = false
					// 先尝试完整月份名称（更长的优先）
					var sortedMonths = months.slice().sort(function (a, b) { return b.length - a.length })
					for (var k = 0; k < sortedMonths.length; k++) {
						var monthName = sortedMonths[k]
						if (input.substr(inputIndex, monthName.length) === monthName) {
							// indexOf 返回 0-based，直接使用
							ethMonth = months.indexOf(monthName)
							inputIndex += monthName.length
							matched = true
							break
						}
					}
					if (!matched) {
						// 再尝试缩写月份名称
						var sortedMonthsShort = monthsShort.slice().sort(function (a, b) { return b.length - a.length })
						for (var l = 0; l < sortedMonthsShort.length; l++) {
							var monthShort = sortedMonthsShort[l]
							if (input.substr(inputIndex, monthShort.length) === monthShort) {
								// indexOf 返回 0-based，直接使用
								ethMonth = monthsShort.indexOf(monthShort)
								inputIndex += monthShort.length
								matched = true
								break
							}
						}
					}
					if (matched) {
						continue
					}
				} else if (tokenType === 'DD' || tokenType === 'D') {
					match = input.substr(inputIndex).match(/^\d{1,2}/)
					if (match) {
						value = parseInt(match[0], 10)
						// 允许解析超出范围的日期，后续会在验证阶段检查
						if (value >= 1) {
							ethDay = value
							inputIndex += match[0].length
							continue
						}
					}
				} else if (tokenType === 'DDD' || tokenType === 'DDDD') {
					match = input.substr(inputIndex).match(/^\d{1,3}/)
					if (match) {
						value = parseInt(match[0], 10)
						// 将一年中的第几天转换为月/日（0-based 月份）
						if (value >= 1 && value <= 366) {
							var m = Math.floor((value - 1) / 30)
							var d = ((value - 1) % 30) + 1
							ethMonth = m
							ethDay = d
							inputIndex += match[0].length
							continue
						}
					}
				}

				// 如果无法匹配，在严格模式下返回 false
				if (strict) {
					return false
				}
			} else {
				// 非 e 前缀标记：尝试跳过或匹配（用于混合格式）
				// 对于公历标记，我们暂时跳过，让原生 moment 处理
				// 这里只处理 e 前缀标记，其他标记跳过
				var remainingInput = input.substr(inputIndex)
				if (remainingInput.length === 0) {
					continue
				}

				// 尝试匹配分隔符（非字母数字字符）
				if (/^[^a-zA-Z0-9]/.test(remainingInput)) {
					// 如果是分隔符，直接跳过
					inputIndex += 1
				} else if (/^\d+/.test(remainingInput)) {
					// 如果是数字，尝试跳过（可能是公历日期部分）
					var skipMatch = remainingInput.match(/^\d+/)
					if (skipMatch) {
						inputIndex += skipMatch[0].length
					}
				} else if (/^[a-zA-Z]+/.test(remainingInput)) {
					// 如果是字母，尝试跳过单词（可能是公历月份名称等）
					var wordMatch = remainingInput.match(/^[a-zA-Z]+/)
					if (wordMatch) {
						inputIndex += wordMatch[0].length
					}
				}
			}
		}

		// 检查是否成功解析了必要的字段
		if (ethYear == null || ethMonth == null || ethDay == null) {
			return false
		}

		// 验证月份范围（0-based: 0-12）
		if (ethMonth < 0 || ethMonth > 12) {
			this._isValid = false
			return true // 返回 true 表示已经处理，但标记为无效
		}

		// 验证日期有效性（daysInMonth 接受 0-based 月份）
		var maxDay = ethiopianCalendar.daysInMonth(ethYear, ethMonth)
		if (ethDay < 1 || ethDay > maxDay) {
			this._isValid = false
			return true // 返回 true 表示已经处理，但标记为无效
		}

		// 将埃历日期转换为公历日期（ethMonth 为 0-based）
		var gregorian = ethiopiaToGregorian(ethYear, ethMonth, ethDay)
		if (gregorian == null) {
			this._isValid = false
			return true // 返回 true 表示已经处理，但标记为无效
		}

		// 设置到 moment 对象上
		setDate(this, gregorian.year, gregorian.month - 1, gregorian.day)

		// 解析时间部分（如果有）
		// 这里可以扩展支持时间解析，暂时只处理日期部分

		return true
	}

	/************************************
	  Calendar detection helpers
	  ************************************/

	eMoment.fn.isEthiopia = function () {
		return this._calendarType === 'ethiopia'
	}

	eMoment.fn.isGregorian = function () {
		return this._calendarType !== 'ethiopia'
	}

	eMoment.fn.getCalendarSystem = function () {
		return this._calendarType || 'gregory'
	}

	/************************************
	  moment.ethiopia factory
	  ************************************/

	// 推荐的语义化创建 API：
	// - moment.ethiopia('2015-01-01', 'eYYYY-eMM-eDD')
	// - moment.ethiopia(2015, 0, 1)  // eYear, eMonth(0-12), eDate
	// - moment.ethiopia({ eYear: 2015, eMonth: 0, eDate: 1 })
	// - moment.ethiopia(new Date())
	// - moment('2025-10-10').ethiopia() // 是否可通过this调用？
	eMoment.ethiopia = function () {
		var args = Array.prototype.slice.call(arguments)

		// 数字重载：moment.ethiopia(eYear, eMonth, eDate)
		if (args.length >= 3 && typeof args[0] === 'number') {
			var ey = args[0]
			var em = args[1] // 0-12 (0-based)
			var ed = args[2]
			var g = ethiopiaToGregorian(ey, em, ed)
			if (g == null) {
				return eMoment.invalid()
			}
			var m = eMoment([g.year, g.month, g.day])
			m._calendarType = 'ethiopia'
			return m
		}

		// 对象重载：moment.ethiopia({ eYear, eMonth, eDate })
		if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
			var obj = args[0]
			if (obj.eYear != null && obj.eMonth != null && obj.eDate != null) {
				var g2 = ethiopiaToGregorian(obj.eYear, obj.eMonth, obj.eDate)
				if (isNaN(g2.year)) return eMoment.invalid()
				var m2 = eMoment([g2.year, g2.month, g2.day])
				m2._calendarType = 'ethiopia'
				return m2
			}
		}

		// 字符串 + 格式：内部仍然依赖 e 前缀格式，只做一层语义包装
		if (typeof args[0] === 'string' && typeof args[1] === 'string') {
			// 这里暂时直接委托给 eMoment(...)，解析扩展会在 parseEthiopia 中完成
			var m3 = eMoment.apply(null, args)
			// 如果格式中出现 e 前缀标记，则视为埃历
			if (args[1].indexOf('eY') !== -1 || args[1].indexOf('eM') !== -1 || args[1].indexOf('eD') !== -1) {
				m3._calendarType = 'ethiopia'
			}
			return m3
		}

		// 其他情况退回原始 moment 行为
		return eMoment.apply(null, args)
	}

	return eMoment
})
