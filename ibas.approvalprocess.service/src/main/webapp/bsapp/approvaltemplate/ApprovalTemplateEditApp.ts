/**
 * @license
 * Copyright Color-Coding Studio. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0
 * that can be found in the LICENSE file at http://www.apache.org/licenses/LICENSE-2.0
 */
namespace approvalprocess {
    export namespace app {

        /** 应用-审批模板 */
        export class ApprovalTemplateEditApp extends ibas.BOEditApplication<IApprovalTemplateEditView, bo.ApprovalTemplate> {

            /** 应用标识 */
            static APPLICATION_ID: string = "dd924e76-424b-47f2-8ee0-8334b7414685";
            /** 应用名称 */
            static APPLICATION_NAME: string = "approvalprocess_app_approvaltemplate_edit";
            /** 业务对象编码 */
            static BUSINESS_OBJECT_CODE: string = bo.ApprovalTemplate.BUSINESS_OBJECT_CODE;
            /** 构造函数 */
            constructor() {
                super();
                this.id = ApprovalTemplateEditApp.APPLICATION_ID;
                this.name = ApprovalTemplateEditApp.APPLICATION_NAME;
                this.boCode = ApprovalTemplateEditApp.BUSINESS_OBJECT_CODE;
                this.description = ibas.i18n.prop(this.name);
            }
            /** 注册视图 */
            protected registerView(): void {
                super.registerView();
                // 其他事件
                this.view.deleteDataEvent = this.deleteData;
                this.view.createDataEvent = this.createData;
                this.view.addApprovalTemplateStepEvent = this.addApprovalTemplateStep;
                this.view.removeApprovalTemplateStepEvent = this.removeApprovalTemplateStep;
                this.view.editApprovalTemplateStepEvent = this.editApprovalTemplateStep;
                this.view.addApprovalTemplateStepConditionEvent = this.addApprovalTemplateStepCondition;
                this.view.removeApprovalTemplateStepConditionEvent = this.removeApprovalTemplateStepCondition;
                this.view.chooseApprovalTemplateStepUserEvent = this.chooseApprovalTemplateStepUserEvent;
                this.view.chooseApprovalTemplateBOInformationEvent = this.chooseApprovalTemplateBOInformationEvent;
            }
            /** 视图显示后 */
            protected viewShowed(): void {
                // 视图加载完成
                if (ibas.objects.isNull(this.editData)) {
                    // 创建编辑对象实例
                    this.editData = new bo.ApprovalTemplate();
                    this.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_data_created_new"));
                }
                this.view.showApprovalTemplate(this.editData);
                this.view.showApprovalTemplateSteps(this.editData.approvalTemplateSteps.filterDeleted());
            }
            /** 运行,覆盖原方法 */
            run(): void;
            run(data: bo.ApprovalTemplate): void;
            run(): void {
                let that: this = this;
                if (ibas.objects.instanceOf(arguments[0], bo.ApprovalTemplate)) {
                    let data: bo.ApprovalTemplate = arguments[0];
                    // 新对象直接编辑
                    if (data.isNew) {
                        that.editData = data;
                        that.show();
                        return;
                    }
                    // 尝试重新查询编辑对象
                    let criteria: ibas.ICriteria = data.criteria();
                    if (!ibas.objects.isNull(criteria) && criteria.conditions.length > 0) {
                        // 有效的查询对象查询
                        let boRepository: bo.BORepositoryApprovalProcess = new bo.BORepositoryApprovalProcess();
                        boRepository.fetchApprovalTemplate({
                            criteria: criteria,
                            onCompleted(opRslt: ibas.IOperationResult<bo.ApprovalTemplate>): void {
                                let data: bo.ApprovalTemplate;
                                if (opRslt.resultCode === 0) {
                                    data = opRslt.resultObjects.firstOrDefault();
                                }
                                if (ibas.objects.instanceOf(data, bo.ApprovalTemplate)) {
                                    // 查询到了有效数据
                                    that.editData = data;
                                    that.show();
                                } else {
                                    // 数据重新检索无效
                                    that.messages({
                                        type: ibas.emMessageType.WARNING,
                                        message: ibas.i18n.prop("shell_data_deleted_and_created"),
                                        onCompleted(): void {
                                            that.show();
                                        }
                                    });
                                }
                            }
                        });
                        // 开始查询数据
                        return;
                    }
                }
                super.run.apply(this, arguments);
            }

            /** 待编辑的数据 */
            protected editData: bo.ApprovalTemplate;
            /** 待编辑的审批步骤数据 */
            protected editApprovalTemplateStepData: bo.ApprovalTemplateStep;
            /** 保存数据 */
            protected saveData(): void {
                let that: this = this;
                let boRepository: bo.BORepositoryApprovalProcess = new bo.BORepositoryApprovalProcess();
                boRepository.saveApprovalTemplate({
                    beSaved: this.editData,
                    onCompleted(opRslt: ibas.IOperationResult<bo.ApprovalTemplate>): void {
                        try {
                            that.busy(false);
                            if (opRslt.resultCode !== 0) {
                                throw new Error(opRslt.message);
                            }
                            if (opRslt.resultObjects.length === 0) {
                                // 删除成功，释放当前对象
                                that.messages(ibas.emMessageType.SUCCESS,
                                    ibas.i18n.prop("shell_data_delete") + ibas.i18n.prop("shell_sucessful"));
                                that.editData = undefined;
                            } else {
                                // 替换编辑对象
                                that.editData = opRslt.resultObjects.firstOrDefault();
                                that.messages(ibas.emMessageType.SUCCESS,
                                    ibas.i18n.prop("shell_data_save") + ibas.i18n.prop("shell_sucessful"));
                            }
                            // 刷新当前视图
                            that.viewShowed();
                        } catch (error) {
                            that.messages(error);
                        }
                    }
                });
                this.busy(true);
                this.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("shell_saving_data"));
            }
            /** 删除数据 */
            protected deleteData(): void {
                let that: this = this;
                this.messages({
                    type: ibas.emMessageType.QUESTION,
                    title: ibas.i18n.prop(this.name),
                    message: ibas.i18n.prop("shell_delete_continue"),
                    actions: [ibas.emMessageAction.YES, ibas.emMessageAction.NO],
                    onCompleted(action: ibas.emMessageAction): void {
                        if (action === ibas.emMessageAction.YES) {
                            that.editData.delete();
                            that.saveData();
                        }
                    }
                });
            }
            /** 新建数据，参数1：是否克隆 */
            protected createData(clone: boolean): void {
                let that: this = this;
                let createData: Function = function (): void {
                    if (clone) {
                        // 克隆对象
                        that.editData = that.editData.clone();
                        that.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_data_cloned_new"));
                        that.viewShowed();
                    } else {
                        // 新建对象
                        that.editData = new bo.ApprovalTemplate();
                        that.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_data_created_new"));
                        that.viewShowed();
                    }
                };
                if (that.editData.isDirty) {
                    this.messages({
                        type: ibas.emMessageType.QUESTION,
                        title: ibas.i18n.prop(this.name),
                        message: ibas.i18n.prop("shell_data_not_saved_continue"),
                        actions: [ibas.emMessageAction.YES, ibas.emMessageAction.NO],
                        onCompleted(action: ibas.emMessageAction): void {
                            if (action === ibas.emMessageAction.YES) {
                                createData();
                            }
                        }
                    });
                } else {
                    createData();
                }
            }
            /** 添加审批模板步骤事件 */
            addApprovalTemplateStep(): void {
                this.editData.approvalTemplateSteps.create();
                // 仅显示没有标记删除的
                this.view.showApprovalTemplateSteps(this.editData.approvalTemplateSteps.filterDeleted());
            }
            /** 删除审批模板步骤事件 */
            removeApprovalTemplateStep(items: bo.ApprovalTemplateStep[]): void {
                // 非数组，转为数组
                if (!(items instanceof Array)) {
                    items = [items];
                }
                if (items.length === 0) {
                    return;
                }
                // 移除项目
                for (let item of items) {
                    if (this.editData.approvalTemplateSteps.indexOf(item) >= 0) {
                        if (item.isNew) {
                            // 新建的移除集合
                            this.editData.approvalTemplateSteps.remove(item);
                        } else {
                            // 非新建标记删除
                            item.delete();
                        }
                    }
                }
                // 仅显示没有标记删除的
                this.view.showApprovalTemplateSteps(this.editData.approvalTemplateSteps.filterDeleted());
            }
            /** 编辑审批模板步骤条件事件 */
            editApprovalTemplateStep(item: bo.ApprovalTemplateStep): void {
                this.editApprovalTemplateStepData = item;
                if (ibas.objects.isNull(this.editApprovalTemplateStepData)) {
                    // 无编辑对象
                    this.view.showApprovalTemplateSteps(this.editData.approvalTemplateSteps.filterDeleted());
                } else {
                    // 存在编辑对象
                    this.view.showApprovalTemplateStepConditions(this.editApprovalTemplateStepData.approvalTemplateStepConditions.filterDeleted());
                }
            }
            /** 添加审批模板步骤条件事件 */
            addApprovalTemplateStepCondition(): void {
                if (!this.editApprovalTemplateStepData) {
                    this.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_please_chooose_data",
                        ibas.i18n.prop("shell_data_edit")));
                    return;
                }
                this.editApprovalTemplateStepData.approvalTemplateStepConditions.create();
                // 仅显示没有标记删除的
                this.view.showApprovalTemplateStepConditions(this.editApprovalTemplateStepData.approvalTemplateStepConditions.filterDeleted());
            }
            /** 删除审批模板步骤条件事件 */
            removeApprovalTemplateStepCondition(items: bo.ApprovalTemplateStepCondition[]): void {
                if (!this.editApprovalTemplateStepData) {
                    this.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_please_chooose_data",
                        ibas.i18n.prop("shell_data_edit")));
                    return;
                }
                // 非数组，转为数组
                if (!(items instanceof Array)) {
                    items = [items];
                }
                if (items.length === 0) {
                    return;
                }
                // 移除项目
                for (let item of items) {
                    if (this.editApprovalTemplateStepData.approvalTemplateStepConditions.indexOf(item) >= 0) {
                        if (item.isNew) {
                            // 新建的移除集合
                            this.editApprovalTemplateStepData.approvalTemplateStepConditions.remove(item);
                        } else {
                            // 非新建标记删除
                            item.delete();
                        }
                    }
                }
                // 仅显示没有标记删除的
                this.view.showApprovalTemplateStepConditions(this.editApprovalTemplateStepData.approvalTemplateStepConditions.filterDeleted());
            }
            /** 选择业务对象类型 */
            chooseApprovalTemplateBOInformationEvent(): void {
                let that: this = this;
                ibas.servicesManager.runChooseService<initialfantasy.bo.IBOInformation>({
                    boCode: initialfantasy.bo.BO_CODE_BOINFORMATION,
                    criteria: [
                    ],
                    onCompleted(selecteds: ibas.IList<initialfantasy.bo.IBOInformation>): void {
                        let selected: initialfantasy.bo.IBOInformation = selecteds.firstOrDefault();
                        that.editData.approvalObjectCode = selected.code;
                        that.view.showApprovalTemplate(that.editData);
                    }
                });
            }
            /** 审批步骤选择步骤所有者 */
            chooseApprovalTemplateStepUserEvent(caller: bo.ApprovalTemplateStep): void {
                let that: this = this;
                ibas.servicesManager.runChooseService<initialfantasy.bo.IUser>({
                    boCode: initialfantasy.bo.BO_CODE_USER,
                    criteria: [
                        new ibas.Condition("activated", ibas.emConditionOperation.EQUAL, ibas.emYesNo.YES)
                    ],
                    onCompleted(selecteds: ibas.IList<initialfantasy.bo.IUser>): void {
                        // 获取触发的对象
                        let index: number = that.editData.approvalTemplateSteps.indexOf(caller);
                        let item: bo.ApprovalTemplateStep = that.editData.approvalTemplateSteps[index];

                        let selected: initialfantasy.bo.IUser = selecteds.firstOrDefault();
                        if (!ibas.objects.isNull(item) && !ibas.objects.isNull(selected)) {
                            item.stepOwner = selected.docEntry;
                        }
                    }
                });
            }
        }
        /** 视图-审批模板 */
        export interface IApprovalTemplateEditView extends ibas.IBOEditView {
            /** 显示数据 */
            showApprovalTemplate(data: bo.ApprovalTemplate): void;
            /** 删除数据事件 */
            deleteDataEvent: Function;
            /** 新建数据事件，参数1：是否克隆 */
            createDataEvent: Function;
            /** 添加审批模板步骤事件 */
            addApprovalTemplateStepEvent: Function;
            /** 删除审批模板步骤事件 */
            removeApprovalTemplateStepEvent: Function;
            /** 显示数据 */
            showApprovalTemplateSteps(datas: bo.ApprovalTemplateStep[]): void;
            /** 编辑审批模板步骤条件事件 */
            editApprovalTemplateStepEvent: Function;
            /** 添加审批模板步骤条件事件 */
            addApprovalTemplateStepConditionEvent: Function;
            /** 删除审批模板步骤条件事件 */
            removeApprovalTemplateStepConditionEvent: Function;
            /** 显示数据 */
            showApprovalTemplateStepConditions(datas: bo.ApprovalTemplateStepCondition[]): void;
            /** 选择业务对象类型 */
            chooseApprovalTemplateBOInformationEvent: Function;
            /** 审批步骤选择步骤所有者 */
            chooseApprovalTemplateStepUserEvent: Function;
        }
    }
}