import { isInclude } from '../node_modules/rc-tree-select/lib/util';

// 重构
export function flatToHierarchy(arr, flag = false) {
  if (!arr.length) {
    return arr;
  }
  const hierarchyNodes = [];
  const levelObj = {};
  arr.forEach((item) => {
    if (!item.pos) {
      return;
    }
    const posLen = item.pos.split('-').length;
    if (!levelObj[posLen]) {
      levelObj[posLen] = [];
    }
    levelObj[posLen].push(item);
  });
  // levelObj 收集每个层级的child
  const levelArr = Object.keys(levelObj).sort((a, b) => b - a);
  console.log(levelObj)
  // const s = Date.now();
  // todo: there are performance issues!
  levelArr.reduce((pre, cur) => {
    if (cur && cur !== pre) {
      levelObj[pre].forEach((item) => {
        let haveParent = false;
        levelObj[cur].forEach((ii) => {
          if (isInclude(ii.pos.split('-'), item.pos.split('-'))) {
            haveParent = true;
            // select multiple模式下的筛选
            if (flag && ii.isAll) {
              return;
            }
            if (!ii.children) {
              ii.children = [];
            }
            ii.children.push(item);
          }
        });
        if (!haveParent) {
          hierarchyNodes.push(item);
        }
      });
    }
    return cur;
  });
  // console.log(Date.now() - s);
  return levelObj[levelArr[levelArr.length - 1]].concat(hierarchyNodes);
}
