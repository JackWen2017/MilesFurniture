// let jsonUrl = 'http://localhost:3000'
let jsonUrl = 'https://5e2bd55d4fdc030014e211e2.mockapi.io'

;(async function() {
  let milesData = []
  let init = async function() {
    milesData = await axios
      .get(`${jsonUrl}/MilesDatas`)
      .then(result => result.data || [])
      .catch(_ => [])
  }

  await init()

  let name = localStorage.getItem('name') || ''
  let actives = JSON.parse(localStorage.getItem('actives')) || []

  let data = await axios
    .get('./assets/data.json')
    .then(res => res.data)
    .catch(() => {})

  let mileF = data['mileF'] || []

  let mileSelectObj = mileF.reduce((preObj, nowItem) => {
    let { id, name } = nowItem
    preObj[id] = name
    return preObj
  }, {})

  let mileStyleObj = mileF.reduce((preObj, nowItem) => {
    let { id, style } = nowItem
    preObj[id] = style
    return preObj
  }, {})

  new Vue({
    el: '#app',
    data: {
      inputName: '',
      name,
      actives,
      userValues: {},
      nowPage: 1,
      index: {
        selectMileF: '',
        selectMileStyle: [],
        selectUser: ''
      }
    },
    computed: {
      showCancelReset() {
        let name = localStorage.getItem('name') || ''
        return name !== ''
      },
      mileFList() {
        return mileF.reduce((preArray, nowItem) => {
          let id = nowItem.id
          let style = nowItem.style
          let styleSize = Object.keys(style).length
          for (let index = 1; index <= styleSize; index++) {
            preArray.push(id + index)
          }
          return preArray
        }, [])
      },
      mileSelectList() {
        return mileSelectObj
      },
      selectMileFIndex: {
        get() {
          return this.index.selectMileF
        },
        set(index) {
          this.index.selectMileF = index
          this.index.selectMileStyle = []
          if (index) {
            list = mileStyleObj[index]
            for (let key of Object.keys(list)) {
              this.index.selectMileStyle.push(key)
            }
          }
        }
      },
      mileStyleSelectList() {
        let list = {}
        let selectF = this.selectMileFIndex
        if (selectF) {
          list = mileStyleObj[selectF]
        }
        return list
      },
      mileStyleAllShow() {
        let styleLength = Object.keys(this.mileStyleSelectList).length
        return styleLength === 0
      },
      userList() {
        return Object.keys(this.userValues)
      },

      filterItem() {
        let filterList = []
        let selectF = this.selectMileFIndex
        let selectStyle = this.index.selectMileStyle
        if (selectF && selectStyle) {
          for (let style of selectStyle) {
            filterList.push(selectF + style)
          }
        }
        return filterList
      },
      filterList() {
        let filterList = []
        let selectF = this.selectMileFIndex
        if (selectF) {
          filterList = this.filterItem
        } else {
          filterList = this.mileFList
        }
        return filterList
      },
      filterUserList() {
        let list = this.filterList
        let filterUser = this.index.selectUser
        if (filterUser) {
          let userData = this.userValues[filterUser]
          list = list.filter(current => userData.indexOf(current) >= 0)
        }
        return list
      }
    },
    methods: {
      updateData(inputName, activeValue) {
        this.name = inputName
        let actives = activeValue || []
        this.actives = actives
        window.localStorage.setItem('name', inputName)
        window.localStorage.setItem('actives', JSON.stringify(actives))
      },
      sendName() {
        let inputName = this.inputName
        if (inputName) {
          let activeValue = this.userValues[inputName]
          let confirmStr = activeValue
            ? `暱稱${inputName}資料已存在，確定使用此暱稱讀取資料?`
            : `確認暱稱:${inputName}?`
          if (confirm(confirmStr)) {
            this.updateData(inputName, activeValue)
          }
        } else {
          alert('請輸入暱稱!!')
        }
      },

      cancelRest() {
        let name = localStorage.getItem('name') || ''
        if (name) {
          this.name = name
        } else {
          alert('無暱稱資料無法取消!!')
        }
      },
      resetData() {
        this.inputName = this.name
        this.name = ''
      },
      changeUserValue() {
        let userValuesInit = milesData.reduce((preObj, current) => {
          let { name, saveData } = current
          preObj[name] = saveData
          return preObj
        }, {})

        this.userValues = userValuesInit
      },
      async changeNowPage(index) {
        if (index === 2) {
          await init()
          this.changeUserValue()
        }
        this.nowPage = index
      },
      checkActive(itemNo) {
        return this.actives.indexOf(itemNo) >= 0
      },
      clickPic(itemNo) {
        let index = this.actives.indexOf(itemNo)
        if (index >= 0) {
          this.actives.splice(index, 1)
        } else {
          this.actives.push(itemNo)
        }
        window.localStorage.setItem('actives', JSON.stringify(actives))
      },
      async insertUserData(user) {
        await axios
          .post(`${jsonUrl}/MilesDatas`, user)
          .then(result => alert('儲存完成!!', result.data))
          .catch(err => alert('儲存失敗!!', err))
      },
      async updateUserData(id, user) {
        await axios
          .put(`${jsonUrl}/MilesDatas/${id}`, user)
          .then(result => alert('修改完成!!', result.data))
          .catch(err => alert('修改失敗!!', err))
      },
      async changeData() {
        let saveData = this.actives
        let name = this.name
        let user = { name, saveData }
        let mileArray = milesData.filter(mile => mile.name === name)
        if (mileArray.length > 0) {
          let id = mileArray[0].id
          await this.updateUserData(id, user)
        } else {
          await this.insertUserData(user)
        }
      },
      async saveChange() {
        let chooseItems = this.actives
        if (chooseItems.length > 0) {
          await this.changeData()
        } else {
          alert('請選擇家俱!!')
        }
      },
      checkStyle(styleValue) {
        return this.index.selectMileStyle.indexOf(styleValue) >= 0
      },
      selectStyle(styleValue) {
        let index = this.index.selectMileStyle.indexOf(styleValue)
        if (index >= 0) {
          this.index.selectMileStyle.splice(index, 1)
        } else {
          this.index.selectMileStyle.push(styleValue)
        }
        this.index.selectMileStyle.sort()
      },
      mileName(mileNo) {
        let mileId = mileNo.substring(0, 1)
        return mileSelectObj[mileId]
      },
      mileStyleName(mileNo) {
        let mileId = mileNo.substring(0, 1)
        let styleNo = mileNo.substring(1)
        return mileStyleObj[mileId][styleNo]
      },
      hasUser(mileNo) {
        let user = []
        for (let [userName, valueArray] of Object.entries(this.userValues)) {
          if (valueArray.indexOf(mileNo) >= 0) {
            user.push(userName)
          }
        }
        return user.join('、') || '無'
      }
    },
    mounted() {
      this.changeUserValue()
    }
  })
})()
