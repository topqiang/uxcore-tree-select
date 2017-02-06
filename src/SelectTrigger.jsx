import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { TreeNode } from 'rc-tree';
import classnames from 'classnames';
import Trigger from 'rc-trigger';
import toArray from 'rc-util/lib/Children/toArray';
import { loopAllChildren, getValuePropValue } from '../node_modules/rc-tree-select/lib/util';
import { flatToHierarchy } from './utils';
import _SelectTrigger from '../node_modules/rc-tree-select/lib/SelectTrigger';
import assign from 'object-assign';
import RightTreeNode from './RightTreeNode';

const BUILT_IN_PLACEMENTS = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: {
      adjustX: 0,
      adjustY: 1,
    },
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1,
    },
  },
};

export default class SelectTrigger extends _SelectTrigger {
  constructor(props) {
    super(props);

    this.onRightDropdownAllclear = this.onRightDropdownAllclear.bind(this);
  }

  componentDidUpdate() {
    const { dropdownMatchSelectWidth, visible } = this.props;

    if (visible) {
      const dropdownDOMNode = this.getPopupDOMNode();
      if (dropdownDOMNode) {
        dropdownDOMNode.style.width = dropdownMatchSelectWidth ?
          `${ReactDOM.findDOMNode(this).offsetWidth * 2}px` : '480px';
      }
    }
  }

  onRightDropdownAllclear() {
    this.props.allClear();
  }

  filterSelectedTreeNode(valueArr, child) {
    if (valueArr.indexOf(child.props.value) > -1) {
      return true;
    }
    return false;
  }

  processSelectedTreeNode(treeNodes) { // 筛选已经选中的treeNode并重组
    const filterPoss = [];
    const { value } = this.props;
    const valueArr = value.map(item => item.value);

    // todo 在严格模式下算全选与不全选

    loopAllChildren(treeNodes, (child, index, pos) => {
      if (this.filterSelectedTreeNode(valueArr, child)) {
        filterPoss.push(pos);
      }
    });

    // Include the filtered nodes's ancestral nodes.
    // 加入processedPoss包括其祖先组件
    const processedPoss = [];
    filterPoss.forEach(pos => {
      const arr = pos.split('-');
      arr.reduce((pre, cur) => {
        const res = `${pre}-${cur}`;
        if (processedPoss.indexOf(res) < 0) {
          processedPoss.push(res);
        }
        return res;
      });
    });
    // 再筛选一遍将node都push进去
    const filterNodesPositions = [];
    loopAllChildren(treeNodes, (child, index, pos) => {
      if (processedPoss.indexOf(pos) > -1) {
        const renderNode = { node: child, pos, isAll: false };
        // 如果有children就是全选的
        if (filterPoss.indexOf(pos) > -1 && child.props.children) {
          renderNode.isAll = true;
        }
        filterNodesPositions.push(renderNode);
      }
    });
    console.log('filterNodesPositions', filterNodesPositions, processedPoss)
    // 阶层 讲平层转换为阶级数组
    const hierarchyNodes = flatToHierarchy(filterNodesPositions, true);
console.log(hierarchyNodes, 'hierarchyNodes')
    const recursive = children =>
      children.map(child => {
        if (child.children) {
          return React.cloneElement(child.node, { isAll: child.isAll }, recursive(child.children));
        }
        // 单一节点 本身就包括children
        return React.cloneElement(child.node, { isAll: child.isAll });
      });

    return recursive(hierarchyNodes);
  }

  renderRightTree(newTreeNodes) {
    const props = this.props;

    const trProps = {
      prefixCls: `${props.prefixCls}-rightTreeNode`,
      removeSelected: props.removeSelected,
      showCheckedStrategy: props.showCheckedStrategy,
      treeNodeLabelProp: props.treeNodeLabelProp,
      model: props.treeCheckable ? 'check' : 'select',
      isMultiple: props.multiple || props.tags || props.treeCheckable,
      fireChange: props.fireChange,
      vls: props.value || [],
      checkVls: props._treeNodesStates && props._treeNodesStates.checkedKeys || [],  // eslint-disable-line
    };

    const recursive = (children, level) =>
      // Note: if use `React.Children.map`, the node's key will be modified.
      toArray(children).map(function handler(child) { // eslint-disable-line
        if (child && child.props.children) {
          // null or String has no Prop
          return (<RightTreeNode
            {...trProps} {...child.props} pos={child.key}
            level={level} isLeft={false} key={child.key}
          >
            {recursive(child.props.children, (level + 1))}
          </RightTreeNode>);
        }
        return (<RightTreeNode
          {...trProps} {...child.props} pos={child.key}
          level={level} isLeft key={child.key}
        />);
      });

    return (
      <div className={`${trProps.prefixCls}`}>
        {recursive(newTreeNodes, 1)}
      </div>
    );
  }

  renderRightDropdown(rightTreeNodes) {
    const {
      rightDropdownAllClearBtn,
      rightDropdownTitle,
      rightDropdownTitleStyle,
      value,
    } = this.props;

    const dropdownRightPrefixCls = `${this.getDropdownPrefixCls()}-right`;

    let renderRightDropdownTitle = null;

    if (rightDropdownTitle) {
      renderRightDropdownTitle = (
        <p className={`${dropdownRightPrefixCls}-title`} style={rightDropdownTitleStyle}>
          {rightDropdownTitle}
        </p>
      );
    }
    const num = value.length || 0; // 后期需要从数据获取;
    const noContent = (<div
      className={`${dropdownRightPrefixCls}-noContent`}
      style={rightDropdownTitle ? { marginTop: '38%' } : {}}
    >
      请从左侧选择
    </div>);
    const clear = (<span
      key="rightDropdownAllclear"
      className={`${dropdownRightPrefixCls}-allClear`}
      onClick={this.onRightDropdownAllclear}
    >清除</span>);

    return (
      <div className={`${dropdownRightPrefixCls}`}>
        <div style={{ padding: '16px' }}>
          {renderRightDropdownTitle}
          <div>
            <span className={`${dropdownRightPrefixCls}-fontS`}>已选择（{num}）</span>
            {rightDropdownAllClearBtn && num ? clear : null}
          </div>
        </div>
        {
          num === 0 ? noContent : this.renderRightTree(rightTreeNodes)
        }
      </div>
    );
  }

  render() {
    const props = this.props;
    const multiple = props.multiple;
    const dropdownPrefixCls = this.getDropdownPrefixCls();
    const popupClassName = {
      [props.dropdownClassName]: !!props.dropdownClassName,
      [`${dropdownPrefixCls}--${multiple ? 'multiple' : 'single'}`]: 1,
    };
    let visible = props.visible;
    const search = multiple || props.combobox || !props.showSearch ? null : (
      <span className={`${dropdownPrefixCls}-search`}>{props.inputElement}</span>
    );

    const recursive = children =>
      // Note: if use `React.Children.map`, the node's key will be modified.
      toArray(children).map(function handler(child) { // eslint-disable-line
        if (child && child.props.children) {
          // null or String has no Prop
          return (<TreeNode {...child.props} key={child.key}>
            {recursive(child.props.children)}
          </TreeNode>);
        }
        return <TreeNode {...child.props} key={child.key} />;
      });

    // const s = Date.now();
    let treeNodes;
    if (props._cachetreeData && this.treeNodes) { // eslint-disable-line
      treeNodes = this.treeNodes;
    } else {
      // 递归塑造TreeNode组件
      treeNodes = recursive(props.treeData || props.treeNodes);
      this.treeNodes = treeNodes;
    }
    // console.log(Date.now()-s);

    if (props.inputValue) {
      treeNodes = this.processTreeNode(treeNodes);
    }

    const rightTreeNodes = this.processSelectedTreeNode(treeNodes);

    const keys = [];
    const halfCheckedKeys = [];
    // 计算keys
    loopAllChildren(treeNodes, (child) => {
      if (props.value.some(item => item.value === getValuePropValue(child))) {
        keys.push(child.key);
      }
      if (props.halfCheckedValues &&
        props.halfCheckedValues.some(item => item.value === getValuePropValue(child))) {
        halfCheckedKeys.push(child.key);
      }
    });

    let notFoundContent;
    if (!treeNodes.length) {
      if (props.notFoundContent) {
        notFoundContent = (<span className={`${props.prefixCls}-not-found`}>
          {props.notFoundContent}</span>);
      } else if (!search) {
        visible = false;
      }
    }
    const popupElement = (<div className={`${props.prefixCls}-setHight`}>
      <div className={`${dropdownPrefixCls}-left`}>
        {search}
        {notFoundContent || this.renderTree(keys, halfCheckedKeys, treeNodes, multiple)}
      </div>
      {this.renderRightDropdown(rightTreeNodes)}
    </div>);

    return (<Trigger
      action={props.disabled ? [] : ['click']} // 设定为点击触发
      ref="trigger"
      popupPlacement="bottomLeft"
      builtinPlacements={BUILT_IN_PLACEMENTS} // 标记位置, 与popupPlacement是一起的
      popupAlign={props.dropdownPopupAlign} // 标记位置 与上面的合并
      prefixCls={dropdownPrefixCls}
      popupTransitionName={this.getDropdownTransitionName()} // 弹窗动画
      onPopupVisibleChange={props.onDropdownVisibleChange} // 弹窗出现或消失会触发
      popup={popupElement} // 显示的内容
      popupVisible={visible} // 弹窗的visible
      getPopupContainer={props.getPopupContainer}
      popupClassName={classnames(popupClassName)}
      popupStyle={props.dropdownStyle}
    >{this.props.children}</Trigger>);
  }
}
