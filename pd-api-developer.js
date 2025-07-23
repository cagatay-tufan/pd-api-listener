var _routerWebServiceAddress = "https://developer.postdicom.com/wssShellService/";
var _regionWebServiceAddress = "";
var _regionWebSocketAddress = "";
var _routerWebServiceClient = null;
var _regionWebServiceClient = null;
var _regionWebSocketClient = null;
var _sessionUuid = "";
var _clientUniqueId = "";

import { XMLHttpRequest } from 'xmlhttprequest';

export function postDicomCloudApi(apiKey, accountKey) {
    this.LogToBrowserConsole = true;
    this.UploaderThreadCount = 1;
    var _logger = null;
    _clientUniqueId = apiKey.trim();
    if (!_routerWebServiceClient) {
        _routerWebServiceClient = new webServiceClient(_routerWebServiceAddress)
    }
    var _maximumBufferLength = 512 * 1024;
    var _maximumReadPartLength = 10240 * 1024;
    var _guidEmpty = "00000000-0000-0000-0000-000000000000";
    var _apiKey = apiKey;
    var _accountKey = accountKey;
    var _initialized = false;
    var _account = null;

    //#region Public Methods
    this.Initialize = function (callback) {
        if (!_initialized) {
            _logger = new logger(this.LogToBrowserConsole);
            _apiKey = _apiKey.trim();
            _accountKey = accountKey.trim();

            var validateParameterList = [];
            validateParameterList.push({ Name: 'apiKey', Type: 'guid', Value: _apiKey });
            validateParameterList.push({ Name: 'accountKey', Type: 'guid', Value: _accountKey });

            if (ValidateParameters(validateParameterList, callback)) {
                var parameters = {};
                parameters.RouterKey = _accountKey;
                parameters.AddressType = "1";
                parameters.AdapterType = "2";
                _routerWebServiceClient.SendHttpRequest('?RequestType=4&Parameters=' + JSON.stringify(parameters), function (request) { //main webservice
                    var serviceResultString = request.responseText;
                    var serviceResult = JSON.parse(serviceResultString);
                    if (serviceResult) {
                        if (serviceResult.ResponseCode == 1) {
                            _regionWebServiceAddress = serviceResult.ResponseMessage;
                            if (!_regionWebServiceClient) {
                                _regionWebServiceClient = new webServiceClient(_regionWebServiceAddress);
                            }
                            parameters = {};
                            parameters.TransactionType = "3";
                            parameters.AccountKey = _accountKey;
                            parameters.ApiKey = _apiKey;
                            //parameters.ClientHostName = location.hostname;Hata
                            _regionWebServiceClient.SendHttpRequest("?RequestType=7&Parameters=" + JSON.stringify(parameters), function (request) {
                                serviceResultString = request.responseText;
                                serviceResult = JSON.parse(serviceResultString);
                                if (serviceResult) {
                                    if (serviceResult.ResponseCode == 1) {
                                        _sessionUuid = serviceResult.ResponseMessage;
                                        var parameters = {};
                                        parameters.RouterKey = _accountKey;
                                        parameters.AddressType = "2";
                                        parameters.AdapterType = "2";
                                        _routerWebServiceClient.SendHttpRequest('?RequestType=4&Parameters=' + JSON.stringify(parameters), function (request) {
                                            serviceResultString = request.responseText;
                                            serviceResult = JSON.parse(serviceResultString);
                                            if (serviceResult) {
                                                if (serviceResult.ResponseCode == 1) {
                                                    _regionWebSocketAddress = serviceResult.ResponseMessage;
                                                    if (!_regionWebSocketClient) {
                                                        _regionWebSocketClient = new webSocketClient(_regionWebSocketAddress);
                                                    }

                                                    var initializeResult = {};
                                                    initializeResult.Success = false;
                                                    initializeResult.Message = "Error while initialize API.";

                                                    var apiSessionManagementRequestMessageParameters = {};
                                                    var apiSessionManagementRequestMessage = new ApiSessionManagementRequestMessage(SessionManagementMessageManagementTypes.CreateApiSession, apiSessionManagementRequestMessageParameters);
                                                    _regionWebSocketClient.SendMessage(apiSessionManagementRequestMessage.Encode(), function (response) {
                                                        var initializeResponseMessage = JSON.parse(response.ApiResult);
                                                        if (initializeResponseMessage.ResponseCode == 1) {
                                                            _initialized = true;
                                                            _account = initializeResponseMessage.ResponseMessage.Account;
                                                            initializeResult.Success = true;
                                                            initializeResult.Message = "API initialized successfully.";
                                                            initializeResult.Account = _account;
                                                        }
                                                        else {
                                                            _initialized = false;
                                                            _logger.Error("Api cannot initialized. Reason: " + initializeResponseMessage.ResponseMessage);
                                                        }

                                                        if (callback) {
                                                            callback(initializeResult);
                                                        }
                                                        else {
                                                            console.error("Callback method undefined!");
                                                        }
                                                    });
                                                }
                                                else {
                                                    if (callback) {
                                                        callback(serviceResult.ResponseMessage);
                                                    }
                                                    else {
                                                        console.error("Callback method undefined!");
                                                    }
                                                }
                                            }
                                            else {
                                                if (callback) {
                                                    callback("Unexpected error. Please contact your administrator.");
                                                }
                                                else {
                                                    console.error("Callback method undefined!");
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        if (callback) {
                                            callback(serviceResult.ResponseMessage);
                                        }
                                        else {
                                            console.error("Callback method undefined!");
                                        }
                                    }
                                }
                                else {
                                    if (callback) {
                                        callback("Unexpected error. Please contact your administrator.");
                                    }
                                    else {
                                        console.error("Callback method undefined!");
                                    }
                                }
                            });
                        }
                        else {
                            if (callback) {
                                callback(serviceResult.ResponseMessage);
                            }
                            else {
                                console.error("Callback method undefined!");
                            }
                        }
                    }
                    else {
                        if (callback) {
                            callback("Unexpected error. Please contact your administrator.");
                        }
                        else {
                            console.error("Callback method undefined!");
                        }
                    }
                });
            }
        }
        else {
            var initializeResult = {};
            initializeResult.Success = true;
            initializeResult.Message = "API initialized successfully.";
            initializeResult.Account = _account;

            if (callback) {
                callback(initializeResult);
            }
            else {
                console.error("Callback method undefined!");
            }
        }
    }

    this.GetPatientOrderList = function (callback, userUuid, institutionUuidList, patientName, accessionNumber, patientId, otherPatientId, modalities) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuidList', Type: 'guidList', Value: institutionUuidList });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuidList = institutionUuidList;
            parameters.PatientName = patientName;
            parameters.AccessionNumber = accessionNumber;
            parameters.PatientId = patientId;
            parameters.OtherPatientId = otherPatientId;
            parameters.Modalities = modalities;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SearchPatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetPatientOrderListWithDateRange = function (callback, userUuid, institutionUuidList, patientName, accessionNumber, patientId, otherPatientId, modalities, startDate, endDate) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuidList', Type: 'guidList', Value: institutionUuidList });
        if (startDate) {
            validateParameterList.push({ Name: 'startDate', Type: 'date', Value: startDate });
        }
        if (endDate) {
            validateParameterList.push({ Name: 'endDate', Type: 'date', Value: endDate });
        }

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuidList = institutionUuidList;
            parameters.PatientName = patientName;
            parameters.AccessionNumber = accessionNumber;
            parameters.PatientId = patientId;
            parameters.OtherPatientId = otherPatientId;
            parameters.Modalities = modalities;
            parameters.StartDate = startDate;
            parameters.EndDate = endDate;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SearchPatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetPatientOrderListWithBirthdate = function (callback, userUuid, institutionUuidList, patientName, accessionNumber, patientId, otherPatientId, modalities, startBirthdate, endBirthdate) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuidList', Type: 'guidList', Value: institutionUuidList });
        if (startBirthdate) {
            validateParameterList.push({ Name: 'startBirthdate', Type: 'date', Value: startBirthdate });
        }
        if (endBirthdate) {
            validateParameterList.push({ Name: 'endBirthdate', Type: 'date', Value: endBirthdate });
        }

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuidList = institutionUuidList;
            parameters.PatientName = patientName;
            parameters.AccessionNumber = accessionNumber;
            parameters.PatientId = patientId;
            parameters.OtherPatientId = otherPatientId;
            parameters.Modalities = modalities;
            parameters.StartBirthdate = startBirthdate;
            parameters.EndBirthdate = endBirthdate;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SearchPatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetPatientOrderListInFolder = function (callback, userUuid, folderUuid) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SearchPatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }

    this.CreateFolder = function (userUuid, parentFolderUuid, folderName, callback) {
        if (parentFolderUuid.length == 0) {
            parentFolderUuid = "00000000-0000-0000-0000-000000000000";
        }

        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'parentFolderUuid', Type: 'guid', Value: parentFolderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.ParentFolderUuid = parentFolderUuid;
            parameters.FolderName = folderName;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.CreateFolder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.CreateFolderWithDescription = function (userUuid, parentFolderUuid, folderName, folderDescription, callback) {
        if (parentFolderUuid.length == 0) {
            parentFolderUuid = "00000000-0000-0000-0000-000000000000";
        }

        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'parentFolderUuid', Type: 'guid', Value: parentFolderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.ParentFolderUuid = parentFolderUuid;
            parameters.FolderName = folderName;
            parameters.FolderDescription = folderDescription;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.CreateFolder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetFolderList = function (userUuid, parentFolderUuid, folderName, getOrdersInFolder, callback) {
        if (parentFolderUuid.length == 0) {
            parentFolderUuid = "00000000-0000-0000-0000-000000000000";
        }

        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'parentFolderUuid', Type: 'guid', Value: parentFolderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.ParentFolderUuid = parentFolderUuid;
            parameters.FolderName = folderName;
            parameters.GetOrdersInFolder = getOrdersInFolder;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SearchFolder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.DeleteFolder = function (userUuid, folderUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.DeleteFolder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }

    this.GetFolderViewUrl = function (userUuid, folderUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetFolderViewUrl, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetViewUrl = function (userUuid, patientOrderUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderUuid = patientOrderUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetViewUrl, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetViewUrlWithPatientName = function (userUuid, patientName, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientName = patientName;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetViewUrl, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetViewUrlWithPatientNameAndBirthDate = function (userUuid, patientName, birthDate, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'birthDate', Type: 'date', Value: birthDate });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientName = patientName;
            parameters.BirthDate = birthDate;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetViewUrl, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.UpdateFolderWithJSON = function (userUuid, folderUuid, jsonParameters, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var folderJson = GetFolderJsonParameters(jsonParameters);

            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;
            parameters.JsonParameters = folderJson;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.UpdateFolderWithJson, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }

    this.DeleteOrder = function (userUuid, patientOrderInstitutionUuid, patientOrderUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderInstitutionUuid', Type: 'guid', Value: patientOrderInstitutionUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderInstitutionUuid = patientOrderInstitutionUuid;
            parameters.PatientOrderUuid = patientOrderUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.DeletePatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.CreateOrderWithMinimumParameters = function (userUuid, institutionUuid, patientName, patientId, modality, studyDescription, orderDate, orderTime, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });
        validateParameterList.push({ Name: 'orderDate', Type: 'date', Value: orderDate });
        validateParameterList.push({ Name: 'orderTime', Type: 'time', Value: orderTime });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuid = institutionUuid;
            parameters.PatientName = patientName;
            parameters.PatientID = patientId;
            parameters.OrderModality = modality;
            parameters.StudyDescription = studyDescription;
            parameters.PerformedDatetime = orderDate + " " + orderTime;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.CreatePatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.CreateOrderWithFullParameters = function (userUuid, institutionUuid, patientName, patientId, patientOtherId, patientBirthdate, modality, studyDescription, accessionNumber, complaints, orderDate, orderTime, procedureId, procedureDescription, scheduledEquipmentUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });
        validateParameterList.push({ Name: 'patientBirthdate', Type: 'date', Value: patientBirthdate });
        validateParameterList.push({ Name: 'orderDate', Type: 'date', Value: orderDate });
        validateParameterList.push({ Name: 'orderTime', Type: 'time', Value: orderTime });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuid = institutionUuid;
            parameters.PatientName = patientName;
            parameters.PatientID = patientId;
            parameters.OtherPatientId = patientOtherId;
            parameters.PatientsBirthDate = patientBirthdate;
            parameters.OrderModality = modality;
            parameters.StudyDescription = studyDescription;
            parameters.OrderAccessionNumber = accessionNumber;
            parameters.PatientComplaints = complaints;
            parameters.PerformedDatetime = orderDate + " " + orderTime;
            parameters.RequestedProcedureId = procedureId;
            parameters.RequestingProcedureDescription = procedureDescription;
            parameters.ScheduledEquipmentUuid = scheduledEquipmentUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.CreatePatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.CreateOrderWithFullParameters2 = function (userUuid, institutionUuid, patientName, patientId, patientOtherId, patientSex, patientBirthdate, modality, studyDescription, accessionNumber, complaints, orderDate, orderTime, procedureId, procedureDescription, scheduledEquipmentUuid, referringPhysiciansName, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });
        validateParameterList.push({ Name: 'patientBirthdate', Type: 'date', Value: patientBirthdate });
        validateParameterList.push({ Name: 'orderDate', Type: 'date', Value: orderDate });
        validateParameterList.push({ Name: 'orderTime', Type: 'time', Value: orderTime });

        if (ValidateParameters(validateParameterList, callback)) {
            if (patientSex != "M" && patientSex != "F" && patientSex != "O") {
                patientSex = "";
            }

            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuid = institutionUuid;
            parameters.PatientName = patientName;
            parameters.PatientID = patientId;
            parameters.OtherPatientId = patientOtherId;
            parameters.PatientsBirthDate = patientBirthdate;
            parameters.OrderModality = modality;
            parameters.StudyDescription = studyDescription;
            parameters.OrderAccessionNumber = accessionNumber;
            parameters.PatientComplaints = complaints;
            parameters.PerformedDatetime = orderDate + " " + orderTime;
            parameters.RequestedProcedureId = procedureId;
            parameters.RequestingProcedureDescription = procedureDescription;
            parameters.ScheduledEquipmentUuid = scheduledEquipmentUuid;
            parameters.PatientSex = patientSex;
            parameters.ReferringPhysiciansName = referringPhysiciansName;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.CreatePatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.CreateOrderWithJSON = function (userUuid, institutionUuid, jsonParameters, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });

        // if (jsonParameters.OtherPatientId) {
        //     result.IdentityInformation.OtherId = jsonParameters.OtherPatientId;
        // }
        // if (jsonParameters.PatientName) {
        //     result.IdentityInformation.Name = jsonParameters.PatientName;
        // }
        // if (jsonParameters.PatientSex) {
        //     result.IdentityInformation.Sex = jsonParameters.PatientSex;
        // }

        if (ValidateParameters(validateParameterList, callback)) {
            var orderJson = GetPatientOrderJsonParameters(jsonParameters);

            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuid = institutionUuid;
            parameters.JsonParameters = orderJson;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.CreatePatientOrderWithJson, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.AddOrderToFolder = function (userUuid, patientOrderInstitutionUuid, patientOrderUuid, folderUuidList, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderInstitutionUuid', Type: 'guid', Value: patientOrderInstitutionUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });
        validateParameterList.push({ Name: 'folderUuidList', Type: 'guidList', Value: folderUuidList });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderInstitutionUuid = patientOrderInstitutionUuid;
            parameters.PatientOrderUuid = patientOrderUuid;
            parameters.FolderUuidList = folderUuidList;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.AddOrderToFolder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.RemoveOrderFromFolder = function (userUuid, folderUuid, patientOrderUuidList, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });
        validateParameterList.push({ Name: 'patientOrderUuidList', Type: 'guidList', Value: patientOrderUuidList });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;
            parameters.PatientOrderUuidList = patientOrderUuidList;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.RemoveOrderFromFolder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.CreateOrderGroup = function (userUuid, patientOrderInstitutionUuid, patientOrderUuidList, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderInstitutionUuid', Type: 'guid', Value: patientOrderInstitutionUuid });
        validateParameterList.push({ Name: 'patientOrderUuidList', Type: 'guidList', Value: patientOrderUuidList });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderInstitutionUuid = patientOrderInstitutionUuid;
            parameters.PatientOrderUuidList = patientOrderUuidList;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.CreateOrderGroup, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.AddOrdersToOrderGroup = function (userUuid, patientOrderInstitutionUuid, connectedGroupUuid, patientOrderUuidList, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderInstitutionUuid', Type: 'guid', Value: patientOrderInstitutionUuid });
        validateParameterList.push({ Name: 'connectedGroupUuid', Type: 'guid', Value: connectedGroupUuid });
        validateParameterList.push({ Name: 'patientOrderUuidList', Type: 'guidList', Value: patientOrderUuidList });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderInstitutionUuid = patientOrderInstitutionUuid;
            parameters.ConnectedGroupUuid = connectedGroupUuid;
            parameters.PatientOrderUuidList = patientOrderUuidList;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.AddOrdersToOrderGroup, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.RemoveOrdersFromGroup = function (userUuid, patientOrderInstitutionUuid, patientOrderUuidList, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderInstitutionUuid', Type: 'guid', Value: patientOrderInstitutionUuid });
        validateParameterList.push({ Name: 'patientOrderUuidList', Type: 'guidList', Value: patientOrderUuidList });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderInstitutionUuid = patientOrderInstitutionUuid;
            parameters.PatientOrderUuidList = patientOrderUuidList;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.RemoveOrdersFromGroup, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetPatientOrderProperties = function (userUuid, patientOrderInstitutionUuid, patientOrderUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderInstitutionUuid', Type: 'guid', Value: patientOrderInstitutionUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderInstitutionUuid = patientOrderInstitutionUuid;
            parameters.PatientOrderUuid = patientOrderUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetPatientOrderProperties, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.AssignPatientOrderToUser = function (userUuid, patientOrderUuid, assignedUserUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });
        validateParameterList.push({ Name: 'assignedUserUuid', Type: 'guid', Value: assignedUserUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderUuid = patientOrderUuid;
            parameters.AssignedUserUuid = assignedUserUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.AssignPatientOrderToUser, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.AssignPatientOrderToUserGroup = function (userUuid, patientOrderUuid, assignedUserGroupUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });
        validateParameterList.push({ Name: 'assignedUserGroupUuid', Type: 'guid', Value: assignedUserGroupUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderUuid = patientOrderUuid;
            parameters.AssignedUserGroupUuid = assignedUserGroupUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.AssignPatientOrderToUserGroup, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetAccountFlagDictionary = function (userUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetAccountFlagDictionary, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.SetFlagToPatientOrder = function (userUuid, patientOrderUuid, groupId, flagId, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });
        validateParameterList.push({ Name: 'groupId', Type: 'int', Value: groupId });
        validateParameterList.push({ Name: 'flagId', Type: 'int', Value: flagId });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderUuid = patientOrderUuid;
            parameters.GroupId = groupId;
            parameters.FlagId = flagId;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SetFlagToPatientOrder, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.UnassignPatientOrderFromUser = function (userUuid, patientOrderUuid, unassignedUserUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });
        validateParameterList.push({ Name: 'unssignedUserUuid', Type: 'guid', Value: unassignedUserUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderUuid = patientOrderUuid;
            parameters.UnassignedUserUuid = unassignedUserUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.UnassignPatientOrderFromUser, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.UnassignPatientOrderFromUserGroup = function (userUuid, patientOrderUuid, unassignedUserGroupUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });
        validateParameterList.push({ Name: 'unassignedUserGroupUuid', Type: 'guid', Value: unassignedUserGroupUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderUuid = patientOrderUuid;
            parameters.UnassignedUserGroupUuid = unassignedUserGroupUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.UnassignPatientOrderFromUserGroup, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.AssignPatientOrderToLocation = function (userUuid, patientOrderUuid, institutionUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.PatientOrderUuid = patientOrderUuid;
            parameters.InstitutionUuid = institutionUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.AssignPatientOrderToInstitution, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }

    this.ShareFolderWithEmail = function (userUuid, folderUuid, email, emailForSendingSharePassword, sharePassword, shareTitle, shareDescription, expireDate, userCanDownloadStudies, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });
        validateParameterList.push({ Name: 'email', Type: 'mail', Value: email });
        validateParameterList.push({ Name: 'emailForSendingSharePassword', Type: 'mail', Value: emailForSendingSharePassword });
        validateParameterList.push({ Name: 'expireDate', Type: 'date', Value: expireDate });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;
            parameters.Email = email;
            parameters.EmailForSendingSharePassword = emailForSendingSharePassword;
            parameters.SharePassword = sharePassword;
            parameters.ShareTitle = shareTitle;
            parameters.ShareDescription = shareDescription;
            parameters.ExpireDate = expireDate;
            parameters.UserCanDownloadStudies = userCanDownloadStudies;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.ShareFolderWithEmail, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.ShareFolderWithURL = function (userUuid, folderUuid, sharePassword, shareTitle, shareDescription, expireDate, userCanDownloadStudies, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });
        validateParameterList.push({ Name: 'expireDate', Type: 'date', Value: expireDate });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;
            parameters.SharePassword = sharePassword;
            parameters.ShareTitle = shareTitle;
            parameters.ShareDescription = shareDescription;
            parameters.ExpireDate = expireDate;
            parameters.UserCanDownloadStudies = userCanDownloadStudies;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.ShareFolderWithURL, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.ShareFolderToUploadWithEmail = function (userUuid, folderUuid, email, emailForSendingSharePassword, sharePassword, shareTitle, shareDescription, expireDate, userCanDownloadStudies, institutionUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });
        validateParameterList.push({ Name: 'email', Type: 'mail', Value: email });
        validateParameterList.push({ Name: 'emailForSendingSharePassword', Type: 'mail', Value: emailForSendingSharePassword });
        validateParameterList.push({ Name: 'expireDate', Type: 'date', Value: expireDate });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;
            parameters.Email = email;
            parameters.EmailForSendingSharePassword = emailForSendingSharePassword;
            parameters.SharePassword = sharePassword;
            parameters.ShareTitle = shareTitle;
            parameters.ShareDescription = shareDescription;
            parameters.ExpireDate = expireDate;
            parameters.UserCanDownloadStudies = userCanDownloadStudies;
            parameters.InstitutionUuid = institutionUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.ShareFolderToUploadWithEmail, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.ShareFolderToUploadWithUrl = function (userUuid, folderUuid, sharePassword, shareTitle, shareDescription, expireDate, userCanDownloadStudies, institutionUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });
        validateParameterList.push({ Name: 'expireDate', Type: 'date', Value: expireDate });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;
            parameters.SharePassword = sharePassword;
            parameters.ShareTitle = shareTitle;
            parameters.ShareDescription = shareDescription;
            parameters.ExpireDate = expireDate;
            parameters.UserCanDownloadStudies = userCanDownloadStudies;
            parameters.InstitutionUuid = institutionUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.ShareFolderToUploadWithUrl, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.ShareFolderWithAccountUser = function (userUuid, folderUuid, sharedUserUuidList, expireDate, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });
        validateParameterList.push({ Name: 'sharedUserUuidList', Type: 'guidList', Value: sharedUserUuidList });
        validateParameterList.push({ Name: 'expireDate', Type: 'date', Value: expireDate });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;
            parameters.SharedUserUuidList = sharedUserUuidList;
            parameters.ExpireDate = expireDate;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.ShareFolderWithAccountUser, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.ShareFolderWithAccountUserGroup = function (userUuid, folderUuid, sharedUserGroupUuidList, expireDate, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });
        validateParameterList.push({ Name: 'sharedUserGroupUuidList', Type: 'guidList', Value: sharedUserGroupUuidList });
        validateParameterList.push({ Name: 'expireDate', Type: 'date', Value: expireDate });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.FolderUuid = folderUuid;
            parameters.SharedUserGroupUuidList = sharedUserGroupUuidList;
            parameters.ExpireDate = expireDate;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.ShareFolderWithAccountUserGroup, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.SharePatientOrder = function (userUuid, orderUuidList, email, emailForSendingSharePassword, userCanDownloadStudies, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'orderUuidList', Type: 'guidList', Value: orderUuidList });
        validateParameterList.push({ Name: 'email', Type: 'mail', Value: email });
        validateParameterList.push({ Name: 'emailForSendingSharePassword', Type: 'mail', Value: emailForSendingSharePassword });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.OrderUuidList = orderUuidList;
            parameters.Email = email;
            parameters.EmailForSendingSharePassword = emailForSendingSharePassword;
            parameters.UserCanDownloadStudies = userCanDownloadStudies;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SharePatientOrderWithEmail, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.CreateQuickShareLink = function (userUuid, orderUuidList, userCanDownloadStudies, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'orderUuidList', Type: 'guidList', Value: orderUuidList });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.OrderUuidList = orderUuidList;
            parameters.UserCanDownloadStudies = userCanDownloadStudies;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SharePatientOrderWithUrl, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.SharePatientOrderWithExpireDate = function (userUuid, orderUuidList, email, emailForSendingSharePassword, userCanDownloadStudies, expireDate, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'orderUuidList', Type: 'guidList', Value: orderUuidList });
        validateParameterList.push({ Name: 'email', Type: 'mail', Value: email });
        validateParameterList.push({ Name: 'emailForSendingSharePassword', Type: 'mail', Value: emailForSendingSharePassword });
        validateParameterList.push({ Name: 'expireDate', Type: 'date', Value: expireDate });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.OrderUuidList = orderUuidList;
            parameters.Email = email;
            parameters.EmailForSendingSharePassword = emailForSendingSharePassword;
            parameters.UserCanDownloadStudies = userCanDownloadStudies;
            parameters.ExpireDate = expireDate;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SharePatientOrderWithEmailWithExpireDate, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.CreateQuickShareLinkWithExpireDate = function (userUuid, orderUuidList, userCanDownloadStudies, expireDate, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'orderUuidList', Type: 'guidList', Value: orderUuidList });
        validateParameterList.push({ Name: 'expireDate', Type: 'date', Value: expireDate });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.OrderUuidList = orderUuidList;
            parameters.UserCanDownloadStudies = userCanDownloadStudies;
            parameters.ExpireDate = expireDate;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.SharePatientOrderWithUrlWithExpireDate, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }

    this.GetUserGroupList = function (userUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetUserGroupList, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetDicomNodeList = function (userUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetDicomNodeList, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetContactList = function (userUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetContactList, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }
    this.GetUserList = function (userUuid, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });

        if (ValidateParameters(validateParameterList, callback)) {
            var parameters = {};
            parameters.UserUuid = userUuid;

            var apiGeneralRequestMessage = new ApiGeneralRequestMessage(GeneralMessageManagementTypes.GetUserList, parameters);
            sendGeneralRequestMessage(apiGeneralRequestMessage, callback);
        }
    }

    this.UploadDicomFiles = function (userUuid, institutionUuid, selectedFiles, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });
        if (ValidateParameters(validateParameterList, callback)) {
            uploadDicomFiles(userUuid, institutionUuid, "", selectedFiles, null, callback, this.UploaderThreadCount);
        }
    }
    this.UploadDicomFilesIntoFolder = function (userUuid, institutionUuid, folderUuid, selectedFiles, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });
        if (ValidateParameters(validateParameterList, callback)) {
            uploadDicomFiles(userUuid, institutionUuid, folderUuid, selectedFiles, null, callback, this.UploaderThreadCount);
        }
    }
    this.UploadDicomFilesWithAnonymization = function (userUuid, institutionUuid, selectedFiles, anonymizedData, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });
        if (ValidateParameters(validateParameterList, callback)) {
            uploadDicomFiles(userUuid, institutionUuid, "", selectedFiles, anonymizedData, callback, this.UploaderThreadCount);
        }
    }
    this.UploadDicomFilesIntoFolderWithAnonymization = function (userUuid, institutionUuid, folderUuid, selectedFiles, anonymizedData, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });
        validateParameterList.push({ Name: 'folderUuid', Type: 'guid', Value: folderUuid });
        if (ValidateParameters(validateParameterList, callback)) {
            uploadDicomFiles(userUuid, institutionUuid, folderUuid, selectedFiles, anonymizedData, callback, this.UploaderThreadCount);
        }
    }
    this.UploadDocumentFiles = function (userUuid, institutionUuid, patientOrderUuid, selectedFiles, callback) {
        var validateParameterList = [];
        validateParameterList.push({ Name: 'userUuid', Type: 'guid', Value: userUuid });
        validateParameterList.push({ Name: 'institutionUuid', Type: 'guid', Value: institutionUuid });
        validateParameterList.push({ Name: 'patientOrderUuid', Type: 'guid', Value: patientOrderUuid });
        if (ValidateParameters(validateParameterList, callback)) {
            uploadDocumentFiles(userUuid, institutionUuid, patientOrderUuid, selectedFiles, callback);
        }
    }
    //#endregion

    //#region Messages
    function ApiSessionManagementRequestMessage(managementType, apiSessionManegementParameters) {
        apiSessionManegementParameters.SessionUuid = _sessionUuid;
        apiSessionManegementParameters.OtherParameterList = [];
        apiSessionManegementParameters.OtherParameterList.push("Api=" + _sessionUuid);
        apiSessionManegementParameters.OtherParameterList.push("ApiKey=" + _apiKey);

        this.StringParameter = JSON.stringify(apiSessionManegementParameters);

        this.Encode = function () {
            var stringParameter = (new TextEncoder(defaultEncodingType)).encode(this.StringParameter);

            var messageLength = 0;
            messageLength += 4;
            messageLength += 4 + stringParameter.length;

            var reqMessage = new RequestMessage("3", messageLength);
            reqMessage.AddInt32(managementType);
            reqMessage.AddBlob(stringParameter);

            this.Base = reqMessage;
            return this;
        }
    }
    function ApiGeneralRequestMessage(managementType, apiGeneralRequestParameters) {
        apiGeneralRequestParameters.ApiKey = _apiKey;
        apiGeneralRequestParameters.AccountKey = _accountKey;
        this.ApiGeneralRequestParameters = JSON.stringify(apiGeneralRequestParameters);

        this.Encode = function () {
            var apiGeneralRequestParameters = (new TextEncoder(defaultEncodingType)).encode(this.ApiGeneralRequestParameters);

            var messageLength = 0;
            messageLength += 1;
            messageLength += 4;
            messageLength += 4 + apiGeneralRequestParameters.length;

            var reqmessage = new RequestMessage("17", messageLength);
            reqmessage.AddInt32(managementType);
            reqmessage.AddBlob(apiGeneralRequestParameters);

            this.Base = reqmessage;
            return this;
        }
    }
    function ApiFileUploadRequestMessage(managementType, apiFileUploadRequestParameters, fileBuffer, userUuid) {
        apiFileUploadRequestParameters.ApiKey = _apiKey;
        apiFileUploadRequestParameters.AccountKey = _accountKey;
        this.ApiFileUploadRequestParameters = JSON.stringify(apiFileUploadRequestParameters);
        this.FileBufferLength = fileBuffer.length;
        this.UserUuid = userUuid;

        this.Encode = function () {
            var apiFileUploadRequestParameters = (new TextEncoder(defaultEncodingType)).encode(this.ApiFileUploadRequestParameters);
            this.UserUuid = (new TextEncoder(defaultEncodingType)).encode(this.UserUuid);

            var messageLength = 0;
            messageLength += 1;
            messageLength += 4;
            messageLength += 4 + apiFileUploadRequestParameters.length;
            messageLength += 4 + fileBuffer.length;
            messageLength += 1 + this.UserUuid.length;

            var requestMessage = new RequestMessage("23", messageLength);
            requestMessage.AddInt32(managementType);
            requestMessage.AddBlob(apiFileUploadRequestParameters);
            requestMessage.AddByteArray(fileBuffer, 0, fileBuffer.length);
            requestMessage.AddString(this.UserUuid);

            this.Base = requestMessage;
            return this;
        }
    }
    function GlobalResponseMessage(response) {
        this.ManagementType = 0;
        this.ApiResult = "";

        var responseBase = new ResponseMessage(response);
        this.ManagementType = responseBase.ReadInt32(defaultEncodingType);
        this.ApiResult = responseBase.ReadBlob(defaultEncodingType);

        this.Base = responseBase;
        return this;
    }
    //#endregion

    //#region WebSocket
    function webSocketClient(socketAddress) {
        this.CallbackDictionary = [];
        this.SocketIsOpened = false;
        this.SocketOpenedCallback = null;
        this.Socket = null;
        this.ClientUniqueId = _clientUniqueId;
        this.SocketAddres = socketAddress + "/?ClientUniqueId=" + this.ClientUniqueId;

        this.Connect = function () {
            this.SocketIsConnecting = true;
            this.Socket = new WebSocket(this.SocketAddres);
            this.Socket.onopen = this.OnSocketOpened;
            this.Socket.onclose = this.OnSocketClosed;
            this.Socket.onerror = this.OnSocketError;
            this.Socket.onmessage = this.OnSocketMessageReceived;
            this.Socket.binaryType = 'arraybuffer';
        }.bind(this);

        this.Close = function () {
            if (this.Socket) {
                this.Socket.close();
            }
        }

        this.OnSocketMessageReceived = function (evt) {
            setTimeout(function () {
                if (evt.data instanceof ArrayBuffer) {
                    var bytearray = new Uint8Array(evt.data);
                    var messageType = bytearray[0] + 256 * bytearray[1];
                    _logger.Log("Main socket message received. MessageType: " + messageType);

                    var responseMessage = null;
                    if (messageType == "4") {
                        responseMessage = new GlobalResponseMessage(evt.data);
                        if (this.CallbackDictionary[responseMessage.Base.RequestedId])
                            this.CallbackDictionary[responseMessage.Base.RequestedId](responseMessage);
                    }
                    else if (messageType == "18") {
                        responseMessage = new GlobalResponseMessage(evt.data);
                        if (this.CallbackDictionary[responseMessage.Base.RequestedId])
                            this.CallbackDictionary[responseMessage.Base.RequestedId](responseMessage);
                    }
                    else if (messageType == "6") {
                        responseMessage = new GlobalResponseMessage(evt.data);
                        if (this.CallbackDictionary[responseMessage.Base.RequestedId])
                            this.CallbackDictionary[responseMessage.Base.RequestedId](responseMessage);
                    }
                }
                else {
                    _logger.Error("Data is not ArrayBuffer type. data = " + evt.data.toString())
                }
            }.bind(this), 1);
        }.bind(this);

        this.OnSocketOpened = function () {
            this.SocketIsOpened = true;
            this.SocketIsConnecting = false;
            _logger.Log("Socket opened.");
            if (this.SocketOpenedCallback) {
                this.SocketOpenedCallback();
                this.SocketOpenedCallback = null;
            }

        }.bind(this);

        this.OnSocketClosed = function () {
            this.SocketIsOpened = false;
            this.SocketIsConnecting = false;
            _logger.Error("Socket closed.");
        }.bind(this);

        this.OnSocketError = function () {
            this.SocketIsOpened = false;
            this.SocketIsConnecting = false;
            _logger.Error("Socket error.");
        }.bind(this);

        this.SendMessage = function (message, callback) {
            if (this.SocketIsOpened) {
                if (callback) {
                    this.CallbackDictionary[message.Base.MessageID] = callback;
                }

                this.Socket.send(message.Base.Buffer);
            }
            else {
                this.SocketOpenedCallback = this.SendMessage.bind(this, message, callback);
                if (!this.SocketIsConnecting)
                    this.Connect();
            }
        }.bind(this);
    }
    //#endregion

    //#region WebService
    function webServiceClient(webServiceUrl) {
        this.WebServiceUrl = webServiceUrl;
        this.ClientUniqueId = _clientUniqueId;

        this.SendHttpRequest = function (requestingUrl, callback) {
            var dateNow = new Date();
            requestingUrl = this.WebServiceUrl + requestingUrl + "&ClientUniqueId=" + this.ClientUniqueId + "&Cache=" + dateNow.valueOf().toString()
            setTimeout(function () {
                var request = new XMLHttpRequest();
                request.responseType = "text/xml";
                request.onerror = function () { alert("Connection Error!") }.bind(this);
                request.onreadystatechange = function (oEvent) {
                    if (request.readyState === 4) {
                        if (request.status === 200) {
                            callback(request);
                        } else {
                            HideLoading();
                            alert("Connection Error!(Status: " + request.status + ")");
                        }
                    }
                }.bind(this);
                request.open("get", requestingUrl, false);
                //request.setRequestHeader('Referer', '127.0.0.1');
                request.send();
            }.bind(this), 100);
        }.bind(this);
    }
    //#endregion

    //#region Logger
    function logger(logToBrowserConsole) {
        this.LogToBrowserConsole = logToBrowserConsole;

        this.Error = function (message, e) {
            if (this.LogToBrowserConsole) {
                console.error(message);
                if (e !== undefined)
                    console.error(e);
            }
        }
        this.Log = function (message) {
            if (this.LogToBrowserConsole)
                console.log(message);
        }
        this.Warn = function (message) {
            if (this.LogToBrowserConsole)
                console.warn(message);
        }
        this.Info = function (message) {
            if (this.LogToBrowserConsole)
                console.info(message);
        }
        this.Debug = function (message) {
            if (this.LogToBrowserConsole)
                console.debug(message);
        }
    }
    //#endregion

    //#region Upload
    var _readProcessIsCompleted = false;
    var _readedFilePartList = [];
    var _ifExistDictionary = {};
    var _fileReader = null;

    function uploadDicomFiles(userUuid, institutionUuid, folderUuid, selectedFiles, anonymousData, callback, uploaderSocketCount) {
        if (_initialized) {

            var fileSize = 0;
            for (var i = 0; i < selectedFiles.length; i++) {
                fileSize += selectedFiles[i].size;
            }
            _totalSelectedFileSize = fileSize;

            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuid = institutionUuid;
            parameters.TotalFileSize = fileSize / 1024;
            parameters.UploaderUuid = userUuid;
            parameters.UploaderName = GetUsernameFromUuid(userUuid) + " - API";
            var uploadMessage = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.Initialize, parameters, [], userUuid);
            if (_regionWebSocketClient) {
                _regionWebSocketClient.SendMessage(uploadMessage.Encode(), function (response) {
                    var serviceResultString = response.ApiResult;
                    var serviceResult = JSON.parse(serviceResultString);
                    if (serviceResult.ResponseCode == 1) {
                        _readedFilePartList = [];
                        _ifExistDictionary = {};
                        _fileReader = new FileReader();
                        if (anonymousData) {
                            readDicomFilesForAnnonimize(serviceResult.SessionUniqueUuid, userUuid, institutionUuid, folderUuid, selectedFiles, 0, selectedFiles.length, anonymousData, uploaderSocketCount, callback);
                        }
                        else {
                            readDicomFiles(_sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, 0, selectedFiles.length, anonymousData, uploaderSocketCount, callback);
                        }
                        sendReadedDicomFiles(userUuid, institutionUuid, uploaderSocketCount, callback);
                    }
                    else {
                        if (callback) {
                            callback(serviceResult);
                        }
                    }
                });
            }
        }
        else {
            _logger.Error("Please initialize api before send message!");
        }
    }

    function readDicomFiles(sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback) {
        _readProcessIsCompleted = false;
        var selectedFileObject = { selectedFile: selectedFiles[currentFileIndex], offset: 0, isDicomChecked: false, isDicom: false, isAlreadyExist: false, PatientOrder: null, CurrentFilePartIndex: 0 };
        readDicomFilesInternal(selectedFileObject, sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
    }
    function readDicomFilesInternal(selectedFileObject, sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback) {
        readPartFromFile(selectedFileObject, function () {
            if (selectedFileObject.offset < selectedFileObject.selectedFile.size) {
                if (currentFileIndex < totalFileCount) {
                    if (_readedFilePartList.length > uploaderSocketCount * 50) {
                        var interval = setInterval(function () {
                            if (currentFileIndex < totalFileCount) {
                                if (_readedFilePartList.length < uploaderSocketCount * 50) {
                                    _fileReader.abort();
                                    clearInterval(interval);
                                    readDicomFilesInternal(selectedFileObject, sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                                }
                            }
                        }.bind(this), 500);
                        return;
                    }
                    else {
                        setTimeout(function () {
                            _fileReader.abort();
                            readDicomFilesInternal(selectedFileObject, sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                        }.bind(this), 1);
                        return;
                    }
                }
                else {
                    _readProcessIsCompleted = true;
                }
            }
            else {
                currentFileIndex++;
                if (currentFileIndex < totalFileCount) {
                    if (_readedFilePartList.length > uploaderSocketCount * 50) {
                        var interval = setInterval(function () {
                            if (currentFileIndex < totalFileCount) {
                                if (_readedFilePartList.length < uploaderSocketCount * 50) {
                                    _fileReader.abort();
                                    clearInterval(interval);
                                    readDicomFiles(sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                                }
                            }
                        }.bind(this), 500);
                        return;
                    }
                    else {
                        setTimeout(function () {
                            _fileReader.abort();
                            readDicomFiles(sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                        }.bind(this), 1);
                        return;
                    }
                }
                else {
                    _readProcessIsCompleted = true;
                }
            }
        }.bind(this), sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
    }

    var _totalSelectedFileSize = 0;
    function sendReadedDicomFiles(userUuid, institutionUuid, uploaderSocketCount, callback) {
        var uploadServiceList = getUploadSockets(userUuid, institutionUuid, uploaderSocketCount);
        var patientOrderList = [];
        var sendedFileSize = 0;
        var sendedFilePartIndex = 0;
        var socketIndex = 0;
        var completed = false;

        function onPartSended(uploadService, bufferLength, response) {
            var serviceResultString = response.ApiResult;
            var serviceResult = JSON.parse(serviceResultString);
            if (serviceResult.ResponseCode == 1) {
                var currentPatientOrder = serviceResult.ResponseMessage.PatientOrder;
                if (currentPatientOrder) {
                    var temp = null;
                    for (var i = 0; i < patientOrderList.length; i++) {
                        if (patientOrderList[i].PatientOrderUuid == currentPatientOrder.PatientOrderUuid) {
                            temp = patientOrderList[i];
                            break;
                        }
                    }

                    if (temp == null) {
                        patientOrderList.push(currentPatientOrder);
                    }
                }

                sendedFileSize += bufferLength;

                if (callback) {
                    var progress = 100 * (sendedFileSize) / _totalSelectedFileSize;
                    callback({ State: "Sending", PatientOrderList: patientOrderList, Progress: progress });
                }
            }
            else {
                _logger.Error("Error while sending files! Message: " + serviceResult.Message);
                callback({ State: serviceResult.Message });
            }

            uploadService.IsBusy = false;
        }

        var uploadTimer = setInterval(function () {
            if (!completed && _readedFilePartList[sendedFilePartIndex]) {
                if (_readedFilePartList[sendedFilePartIndex].IsAlreadyExist) {
                    sendedFileSize += _readedFilePartList[sendedFilePartIndex].FileBufferLength;

                    if (_readedFilePartList[sendedFilePartIndex].PatientOrder != null) {
                        var temp = null;
                        for (var i = 0; i < patientOrderList.length; i++) {
                            if (patientOrderList[i].PatientOrderUuid == _readedFilePartList[sendedFilePartIndex].PatientOrder.PatientOrderUuid) {
                                temp = patientOrderList[i];
                                break;
                            }
                        }

                        if (temp == null) {
                            patientOrderList.push(_readedFilePartList[sendedFilePartIndex].PatientOrder);
                        }
                    }

                    if (callback) {
                        var progress = 100 * (sendedFileSize) / _totalSelectedFileSize;
                        callback({ State: "Sending", PatientOrderList: patientOrderList, Progress: progress });
                    }

                    _readedFilePartList[sendedFilePartIndex] = null;
                    _readedFilePartList.splice(sendedFilePartIndex, 1);
                }
                else {
                    if (!uploadServiceList[socketIndex].IsBusy && uploadServiceList[socketIndex].IsRegistered) {
                        uploadServiceList[socketIndex].IsBusy = true;
                        uploadServiceList[socketIndex].Socket.SendMessage(_readedFilePartList[sendedFilePartIndex].Encode(), onPartSended.bind(this, uploadServiceList[socketIndex], _readedFilePartList[sendedFilePartIndex].FileBufferLength));

                        _readedFilePartList[sendedFilePartIndex] = null;
                        _readedFilePartList.splice(sendedFilePartIndex, 1);
                    }

                    socketIndex++;
                    if (socketIndex >= uploaderSocketCount) {
                        socketIndex = 0;
                    }
                }
            }
            else if (_readProcessIsCompleted) {
                completed = true;
            }

            if (completed) {
                clearInterval(uploadTimer);

                var checkCompleted = setInterval(function () {
                    var stopSockets = true;
                    for (var i = 0; i < uploadServiceList.length; i++) {
                        if (uploadServiceList[i].IsBusy) {
                            stopSockets = false;
                            break;
                        }
                    }

                    if (stopSockets) {
                        if (callback) {
                            for (var i = 0; i < uploadServiceList.length; i++) {
                                uploadServiceList[i].Socket.Close();
                            }
                            uploadServiceList = [];

                            callback({ State: "File Upload Completed", PatientOrderList: patientOrderList });
                        }

                        clearInterval(checkCompleted);
                    }
                }.bind(this), 10);
                return;
            }

        }.bind(this), 10);
        return;
    }
    function getUploadSockets(userUuid, institutionUuid, uploaderSocketCount) {
        var sockets = [];
        for (var i = 0; i < _account.UserList.length; i++) {
            if (_account.UserList[i].UserUuid == userUuid) {
                for (var j = 0; j < _account.UserList[i].InstitutionList.length; j++) {
                    if (_account.UserList[i].InstitutionList[j].InstitutionUuid == institutionUuid) {
                        for (var s = 0; s < uploaderSocketCount; s++) {
                            var socket = { Socket: new webSocketClient(_regionWebSocketAddress), IsBusy: false, IsRegistered: false };
                            sockets.push(socket);

                            var apiSessionManagementRequestMessageParameters = {};
                            var apiSessionManagementRequestMessage = new ApiSessionManagementRequestMessage(SessionManagementMessageManagementTypes.RegisterSession, apiSessionManagementRequestMessageParameters);
                            socket.Socket.SendMessage(apiSessionManagementRequestMessage.Encode(), function (socket) {
                                socket.IsRegistered = true;
                            }.bind(this, socket));
                        }
                        return sockets;
                    }
                }
            }
        }
        return sockets;
    }

    function readPartFromFile(selectedFileObject, readedCallback, sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback) {
        var partOffsetMutliple = 1;

        if (selectedFileObject.offset == 0 && anonymousData) {
            _fileReader = new FileReader();
            _fileReader.onabort = function (e) { };
            _fileReader.onloadstart = function (e) { };
            _fileReader.onprogress = function (evt) {
                var progress = 100 * evt.loaded / selectedFileObject.selectedFile.size;
                _logger.Info("State: Reading, FileIndex: " + currentFileIndex + ", Progress: " + progress);
            };
            _fileReader.onload = function (file, evt) {
                try {
                    return function (evt) {
                        var byteArray = new Uint8Array(evt.target.result);

                        if (callback) {
                            if ((file.offset + byteArray.length) >= file.selectedFile.size) {
                                var progress = ((currentFileIndex + 1) / totalFileCount) * 100;
                                callback({ State: "Reading", Progress: progress });
                            }
                        }

                        if (!file.isDicomChecked) {
                            file.isDicom = fileIsDicom(byteArray);
                            file.isDicomChecked = true;

                            if (!file.isDicom) {
                                if (file.offset < file.selectedFile.size) {
                                    file.isDicomChecked = false;
                                }
                            }
                        }

                        if (file.isDicomChecked) {
                            if (file.isDicom) {

                                if (file.offset == 0) {
                                    var oldLength = byteArray.length;

                                    if (anonymousData) {
                                        var dicomDataSet = dicomParser.parseDicom(byteArray);
                                        var transferSyntax = dicomDataSet.string("x00020010");
                                        if (transferSyntax == "1.2.840.10008.1.2") {
                                            for (var m = 0; m < anonymousData.length; m++) {
                                                var tag = anonymousData[m].Tag;
                                                var element = dicomDataSet.elements[tag];
                                                if (element) {
                                                    var newValue = anonymousData[m].Value;
                                                    if (newValue == "undefined")
                                                        newValue = "";
                                                    var newValueArray = [];
                                                    for (var i = 0; i < newValue.length; i++) {
                                                        newValueArray[i] = newValue.charCodeAt(i);
                                                    }

                                                    byteArray = replaceElementImplicit(dicomDataSet.elements, element, byteArray, newValueArray);
                                                }
                                            }
                                        }
                                        else {
                                            for (var m = 0; m < anonymousData.length; m++) {
                                                var tag = anonymousData[m].Tag;
                                                var element = dicomDataSet.elements[tag];
                                                if (element) {
                                                    var newValue = anonymousData[m].Value;
                                                    if (newValue == "undefined")
                                                        newValue = "";
                                                    var newValueArray = [];
                                                    for (var i = 0; i < newValue.length; i++) {
                                                        newValueArray[i] = newValue.charCodeAt(i);
                                                    }
                                                    newValueArray.push(32);

                                                    var dicomVrInformation = new dicomVrInformations();
                                                    var lengthAnonymous = newValueArray.length;//68
                                                    if (element.vr && element.vr.length > 0) {
                                                        var vrInfo = dicomVrInformation.GetVrInformation(element.vr);
                                                        if (vrInfo != null) {
                                                            if (!vrInfo.MustFixLength)
                                                                lengthAnonymous = Math.min(lengthAnonymous, vrInfo.Length);
                                                        }
                                                    }

                                                    var result = [];
                                                    for (var i = 0; i < lengthAnonymous; i++) {
                                                        result[i] = newValueArray[i];
                                                    }

                                                    byteArray = replaceElement(dicomDataSet.elements, element, byteArray, result);
                                                }
                                            }
                                        }
                                    }

                                    //check file if exists
                                    var dicomDataSet = dicomParser.parseDicom(byteArray);

                                    var studyInstanceUid = dicomDataSet.string("x0020000d");
                                    if (_ifExistDictionary[studyInstanceUid] == undefined || _ifExistDictionary[studyInstanceUid]) {
                                        var parameters = {};
                                        parameters.SessionUniqueUuid = sessionUuid;
                                        parameters.InstitutionUuid = institutionUuid;
                                        parameters.UserUuid = userUuid;
                                        if (folderUuid != "") {
                                            parameters.FolderUuid = folderUuid;
                                        }

                                        parameters.StudyInstanceUid = studyInstanceUid;
                                        parameters.PatientName = dicomDataSet.string("x00100010");
                                        parameters.PatientId = dicomDataSet.string("x00100020");
                                        parameters.SeriesInstanceUid = dicomDataSet.string("x0020000e");
                                        parameters.SopInstanceUid = dicomDataSet.string("x00080018");

                                        var reqMessage = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.CheckFileExist, parameters, [], userUuid);

                                        _regionWebSocketClient.SendMessage(reqMessage.Encode(), function (response) {
                                            var serviceResultString = response.ApiResult;
                                            var serviceResult = JSON.parse(serviceResultString);

                                            _ifExistDictionary[serviceResult.StudyInstanceUid] = serviceResult.ResponseMessage.FileIfExist;
                                            if (!serviceResult.ResponseMessage.FileIfExist) {
                                                addToList(false, null);
                                            }
                                            else {
                                                file.PatientOrder = serviceResult.ResponseMessage.PatientOrder;
                                                addToList(true, serviceResult.ResponseMessage.PatientOrder);

                                                if (callback) {
                                                    callback({ State: "Checking", PatientOrder: serviceResult.ResponseMessage.PatientOrder, Message: "File already exist. FileName: " + file.selectedFile.name });
                                                }

                                            }
                                        });
                                    }
                                    else {
                                        addToList(false, null);
                                    }
                                }
                                else {
                                    addToList(file.isAlreadyExist, file.PatientOrder);
                                }

                                function addToList(isAlreadyExist, patientOrder) {
                                    var length = byteArray.length;
                                    _totalSelectedFileSize += length - oldLength;
                                    var maximumBufferLength = Math.ceil(length / (oldLength / _maximumBufferLength));

                                    var currentFilePartCount = Math.ceil(file.selectedFile.size / _maximumBufferLength);
                                    if (length < maximumBufferLength) {
                                        var parameters = {};
                                        parameters.SessionUniqueUuid = sessionUuid;
                                        parameters.InstitutionUuid = institutionUuid;
                                        parameters.UserUuid = userUuid;
                                        parameters.FileIndex = currentFileIndex;
                                        parameters.CurrentFilePartIndex = file.CurrentFilePartIndex++;
                                        parameters.CurrentFileTotalPartCount = currentFilePartCount;
                                        if (folderUuid) {
                                            parameters.FolderUuidList = [];
                                            parameters.FolderUuidList.push(folderUuid);
                                        }
                                        var filePart = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessFile, parameters, byteArray, userUuid);

                                        _readedFilePartList.push(filePart);
                                    }
                                    else {
                                        var bufferPart = [];
                                        for (var m = 0; m < length; m++) {
                                            bufferPart.push(byteArray[m]);
                                            if (bufferPart.length == maximumBufferLength || m == length - 1) {
                                                var parameters = {};
                                                parameters.SessionUniqueUuid = sessionUuid;
                                                parameters.InstitutionUuid = institutionUuid;
                                                parameters.UserUuid = userUuid;
                                                parameters.FileIndex = currentFileIndex;
                                                parameters.CurrentFilePartIndex = file.CurrentFilePartIndex++;
                                                parameters.CurrentFileTotalPartCount = currentFilePartCount;
                                                if (folderUuid) {
                                                    parameters.FolderUuidList = [];
                                                    parameters.FolderUuidList.push(folderUuid);
                                                }
                                                var filePart = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessFile, parameters, bufferPart, userUuid);

                                                _readedFilePartList.push(filePart);
                                                bufferPart = [];
                                            }
                                        }
                                    }

                                    _fileReader.abort();
                                    file.offset += byteArray.length;
                                    byteArray = null;
                                    if (readedCallback) {
                                        readedCallback();
                                    }
                                }
                            }
                            else {
                                _logger.Error("Unsupported file! FileName: " + file.selectedFile.name)

                                if (callback) {
                                    callback({ State: "Error", Message: "Unsupported file! FileName: " + file.selectedFile.name });
                                }

                                _totalSelectedFileSize -= file.size;

                                currentFileIndex++;
                                if (currentFileIndex < totalFileCount) {
                                    readDicomFiles(_sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                                }
                                else {
                                    _readProcessIsCompleted = true;
                                }
                            }
                        }
                        else {
                            _fileReader.abort();
                            partOffsetMutliple++;
                            var slice = selectedFileObject.selectedFile.slice(selectedFileObject.offset, (selectedFileObject.offset + (partOffsetMutliple * _maximumReadPartLength)));
                            _fileReader.readAsArrayBuffer(slice);
                        }
                    }.bind(this);
                }
                catch (e) {

                    _logger.Error("Unsupported file! FileName: " + file.selectedFile.name)

                    if (callback) {
                        callback({ State: "Error", Message: "Unsupported file! FileName: " + file.selectedFile.name });
                    }

                    _totalSelectedFileSize -= file.size;

                    _fileReader.abort();
                    currentFileIndex++;
                    if (currentFileIndex < totalFileCount) {
                        readDicomFiles(_sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                    }
                    else {
                        _readProcessIsCompleted = true;
                    }
                }
            }.bind(this, selectedFileObject);

            _fileReader.abort();
            var slice = selectedFileObject.selectedFile.slice(selectedFileObject.offset, (selectedFileObject.offset + _maximumReadPartLength));
            _fileReader.readAsArrayBuffer(slice);
        }
        else {
            _fileReader = new FileReader();
            _fileReader.onabort = function (e) { };
            _fileReader.onloadstart = function (e) { };
            _fileReader.onprogress = function (evt) {
                var progress = 100 * evt.loaded / selectedFileObject.selectedFile.size;
                _logger.Info("State: Reading, FileIndex: " + currentFileIndex + ", Progress: " + progress);
            };
            _fileReader.onload = function (file, evt) {
                try {
                    var byteArray = new Uint8Array(evt.target.result);

                    if (callback) {
                        var progress = ((currentFileIndex + 1) / totalFileCount) * 100;
                        callback({ State: "Reading", Progress: progress });
                    }

                    if (!file.isDicomChecked) {
                        file.isDicom = fileIsDicom(byteArray);
                        file.isDicomChecked = true;

                        if (!file.isDicom) {
                            if (file.offset < file.selectedFile.size) {
                                file.isDicomChecked = false;
                            }
                        }
                    }

                    if (file.isDicomChecked) {
                        if (file.isDicom) {

                            if (file.offset == 0) {
                                //check file if exists
                                var dicomDataSet = dicomParser.parseDicom(byteArray);

                                var studyInstanceUid = dicomDataSet.string("x0020000d");
                                if (_ifExistDictionary[studyInstanceUid] == undefined || _ifExistDictionary[studyInstanceUid]) {

                                    var parameters = {};
                                    parameters.SessionUniqueUuid = sessionUuid;
                                    parameters.InstitutionUuid = institutionUuid;
                                    parameters.UserUuid = userUuid;
                                    if (folderUuid != "") {
                                        parameters.FolderUuid = folderUuid;
                                    }

                                    parameters.StudyInstanceUid = studyInstanceUid;
                                    parameters.PatientName = dicomDataSet.string("x00100010");
                                    parameters.PatientId = dicomDataSet.string("x00100020");
                                    parameters.SeriesInstanceUid = dicomDataSet.string("x0020000e");
                                    parameters.SopInstanceUid = dicomDataSet.string("x00080018");

                                    var reqMessage = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.CheckFileExist, parameters, [], userUuid);
                                    _regionWebSocketClient.SendMessage(reqMessage.Encode(), function (response) {
                                        var serviceResultString = response.ApiResult;
                                        var serviceResult = JSON.parse(serviceResultString);

                                        _ifExistDictionary[serviceResult.StudyInstanceUid] = serviceResult.ResponseMessage.FileIfExist;
                                        if (!serviceResult.ResponseMessage.FileIfExist) {
                                            addToList(false, null);
                                        }
                                        else {
                                            file.PatientOrder = serviceResult.ResponseMessage.PatientOrder;
                                            addToList(true, serviceResult.ResponseMessage.PatientOrder);

                                            if (callback) {
                                                callback({ State: "Checking", PatientOrder: serviceResult.ResponseMessage.PatientOrder, Message: "File already exist. FileName: " + file.selectedFile.name });
                                            }

                                        }
                                    });
                                }
                                else {
                                    addToList(false, null);
                                }
                            }
                            else {
                                addToList(file.isAlreadyExist, file.PatientOrder);
                            }

                            function addToList(isAlreadyExist, patientOrder) {
                                var length = byteArray.length;
                                var currentFilePartCount = Math.ceil(file.selectedFile.size / _maximumBufferLength);
                                if (length < _maximumBufferLength) {
                                    var parameters = {};
                                    parameters.SessionUniqueUuid = sessionUuid;
                                    parameters.InstitutionUuid = institutionUuid;
                                    parameters.UserUuid = userUuid;
                                    parameters.FileIndex = currentFileIndex;
                                    parameters.CurrentFilePartIndex = file.CurrentFilePartIndex++;
                                    parameters.CurrentFileTotalPartCount = currentFilePartCount;
                                    if (folderUuid) {
                                        parameters.FolderUuidList = [];
                                        parameters.FolderUuidList.push(folderUuid);
                                    }
                                    var filePart = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessFile, parameters, byteArray, userUuid);

                                    _readedFilePartList.push(filePart);
                                }
                                else {
                                    var bufferPart = [];
                                    for (var m = 0; m < length; m++) {
                                        bufferPart.push(byteArray[m]);
                                        if (bufferPart.length == _maximumBufferLength || m == length - 1) {
                                            var parameters = {};
                                            parameters.SessionUniqueUuid = sessionUuid;
                                            parameters.InstitutionUuid = institutionUuid;
                                            parameters.UserUuid = userUuid;
                                            parameters.FileIndex = currentFileIndex;
                                            parameters.CurrentFilePartIndex = file.CurrentFilePartIndex++;
                                            parameters.CurrentFileTotalPartCount = currentFilePartCount;
                                            if (folderUuid) {
                                                parameters.FolderUuidList = [];
                                                parameters.FolderUuidList.push(folderUuid);
                                            }
                                            var filePart = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessFile, parameters, bufferPart, userUuid);

                                            _readedFilePartList.push(filePart);
                                            bufferPart = [];
                                        }
                                    }
                                }

                                _fileReader.abort();
                                file.offset += byteArray.length;
                                byteArray = null;
                                if (readedCallback) {
                                    setTimeout(function () {
                                        readedCallback();
                                    }, 10)
                                    return;
                                }
                            }
                        }
                        else {
                            _logger.Error("Unsupported file! FileName: " + file.selectedFile.name)

                            if (callback) {
                                callback({ State: "Error", Message: "Unsupported file! FileName: " + file.selectedFile.name });
                            }

                            _totalSelectedFileSize -= file.size;

                            currentFileIndex++;
                            if (currentFileIndex < totalFileCount) {
                                setTimeout(function () {
                                    readDicomFiles(_sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                                }, 10);
                                return;
                            }
                            else {
                                _readProcessIsCompleted = true;
                            }
                        }
                    }
                    else {
                        _fileReader.abort();
                        partOffsetMutliple++;
                        var slice = selectedFileObject.selectedFile.slice(selectedFileObject.offset, (selectedFileObject.offset + (partOffsetMutliple * _maximumReadPartLength)));
                        _fileReader.readAsArrayBuffer(slice);
                    }
                }
                catch (e) {

                    _logger.Error("Unsupported file! FileName: " + file.selectedFile.name)

                    if (callback) {
                        callback({ State: "Error", Message: "Unsupported file! FileName: " + file.selectedFile.name });
                    }

                    _totalSelectedFileSize -= file.size;

                    _fileReader.abort();
                    currentFileIndex++;
                    if (currentFileIndex < totalFileCount) {
                        setTimeout(function () {
                            readDicomFiles(_sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                        }, 10);
                        return;
                    }
                    else {
                        _readProcessIsCompleted = true;
                    }
                }
            }.bind(this, selectedFileObject);

            _fileReader.abort();
            var slice = selectedFileObject.selectedFile.slice(selectedFileObject.offset, (selectedFileObject.offset + _maximumReadPartLength));
            _fileReader.readAsArrayBuffer(slice);
        }

        function fileIsDicom(byteArray) {
            var result = false;
            try {
                var dicomDataSet = dicomParser.parseDicom(byteArray, {
                    untilTag: "x7fe00010"
                });
                if (dicomDataSet)
                    result = true;
            }
            catch (e) {
                _logger.Error("Cannot process file.", e);
                result = false;
            }
            finally {
                byteArray = null;
            }

            return result;
        }

        function dicomVrInformations() {
            this.VrInformations = new vrInformationObject();

            this.GetVrInformation = function (vr) {
                if (this.VrInformations.VrInformationList[vr]) {
                    return this.VrInformations.VrInformationList[vr];
                }
                else
                    return null;
            }
        }

        function vrInformationObject() {
            this.VrInformationList = {};
            this.VrInformationList["AE"] = new vrInformation(false, 16);
            this.VrInformationList["AS"] = new vrInformation(true, 4);
            this.VrInformationList["AT"] = new vrInformation(true, 4);
            this.VrInformationList["CS"] = new vrInformation(false, 16);
            this.VrInformationList["DA"] = new vrInformation(true, 8);
            this.VrInformationList["DS"] = new vrInformation(false, 16);
            this.VrInformationList["DT"] = new vrInformation(false, 26);
            this.VrInformationList["FL"] = new vrInformation(true, 4);
            this.VrInformationList["FD"] = new vrInformation(true, 8);

            this.VrInformationList["IS"] = new vrInformation(false, 12);
            this.VrInformationList["LO"] = new vrInformation(false, 64);
            this.VrInformationList["LT"] = new vrInformation(false, 10240);
            this.VrInformationList["OD"] = new vrInformation(false, Math.pow(2, 32) - 8);
            this.VrInformationList["OF"] = new vrInformation(false, Math.pow(2, 32) - 4);
            this.VrInformationList["PN"] = new vrInformation(false, 64);

            this.VrInformationList["SH"] = new vrInformation(false, 16);
            this.VrInformationList["SL"] = new vrInformation(true, 4);
            this.VrInformationList["SS"] = new vrInformation(true, 2);
            this.VrInformationList["ST"] = new vrInformation(false, 1024);

            this.VrInformationList["TM"] = new vrInformation(false, 16);
            this.VrInformationList["UI"] = new vrInformation(false, 64);
            this.VrInformationList["UL"] = new vrInformation(true, 4);
            this.VrInformationList["US"] = new vrInformation(true, 2);
            this.VrInformationList["UT"] = new vrInformation(false, Math.pow(2, 32) - 2);

        }

        function vrInformation(mustFixLength, length) {
            this.MustFixLength = mustFixLength;
            this.Length = length;
        }

        function replaceElement(allElements, element, allBytes, newValueArray) {
            var oldLength = element.length;
            var newLength = newValueArray.length;
            var oldOffset = element.dataOffset;
            var diffOffset = newLength - oldLength;

            allBytes[element.dataOffset - 2] = newLength % 255;
            allBytes[element.dataOffset - 1] = 255 * Math.floor(newLength / 255);

            allBytes = deleteAndMergeArray(allBytes, oldOffset, oldLength);
            allBytes = insertAndMergeArray(allBytes, oldOffset, new Uint8Array(newValueArray));

            element.length = newLength;
            for (var key in allElements) {
                if (allElements[key].dataOffset > element.dataOffset) {
                    allElements[key].dataOffset += diffOffset;
                }
            }

            return allBytes;

            function deleteAndMergeArray(uint8Array, startPosition, sliceLength) {
                var frontValues = new Uint8Array(uint8Array.buffer, 0, startPosition);
                var backValues = new Uint8Array(uint8Array.buffer, startPosition + sliceLength);
                var mergedArray = new Uint8Array(frontValues.length + backValues.length);

                mergedArray.set(frontValues);
                mergedArray.set(backValues, startPosition);

                return new Uint8Array(mergedArray.buffer);
            }

            function insertAndMergeArray(uint8Array, insertPosition, insertArray) {
                var frontValues = new Uint8Array(uint8Array.buffer, 0, insertPosition);
                var backValues = new Uint8Array(uint8Array.buffer, insertPosition);
                var newValues = insertArray;
                var mergedArray = new Uint8Array(frontValues.length + insertArray.length + backValues.length);

                mergedArray.set(frontValues);
                mergedArray.set(insertArray, insertPosition)
                mergedArray.set(backValues, (insertPosition + insertArray.length));

                return new Uint8Array(mergedArray.buffer);
            }
        }
        function replaceElementImplicit(allElements, element, allBytes, newValueArray) {
            var oldLength = element.length;
            var newLength = newValueArray.length;
            var oldOffset = element.dataOffset;
            var diffOffset = newLength - oldLength;

            allBytes[element.dataOffset - 4] = newLength % 255;

            allBytes = deleteAndMergeArray(allBytes, oldOffset, oldLength);
            allBytes = insertAndMergeArray(allBytes, oldOffset, new Uint8Array(newValueArray));

            element.length = newLength;
            for (var key in allElements) {
                if (allElements[key].dataOffset > element.dataOffset) {
                    allElements[key].dataOffset += diffOffset;
                }
            }

            return allBytes;

            function deleteAndMergeArray(uint8Array, startPosition, sliceLength) {
                var frontValues = new Uint8Array(uint8Array.buffer, 0, startPosition);
                var backValues = new Uint8Array(uint8Array.buffer, startPosition + sliceLength);
                var mergedArray = new Uint8Array(frontValues.length + backValues.length);

                mergedArray.set(frontValues);
                mergedArray.set(backValues, startPosition);

                return new Uint8Array(mergedArray.buffer);
            }

            function insertAndMergeArray(uint8Array, insertPosition, insertArray) {
                var frontValues = new Uint8Array(uint8Array.buffer, 0, insertPosition);
                var backValues = new Uint8Array(uint8Array.buffer, insertPosition);
                var newValues = insertArray;
                var mergedArray = new Uint8Array(frontValues.length + insertArray.length + backValues.length);

                mergedArray.set(frontValues);
                mergedArray.set(insertArray, insertPosition)
                mergedArray.set(backValues, (insertPosition + insertArray.length));

                return new Uint8Array(mergedArray.buffer);
            }
        }
    }

    function readDicomFilesForAnnonimize(sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback) {
        _readProcessIsCompleted = false;
        var selectedFile = selectedFiles[currentFileIndex];
        if (selectedFile.name.indexOf("DICOMDIR") <= -1) {
            _fileReader.onabort = function (e) { };
            _fileReader.onloadstart = function (e) { };
            _fileReader.onprogress = function (evt) {
                var progress = 100 * evt.loaded / evt.total;
                _logger.Info("State: Reading, FileIndex: " + currentFileIndex + ", Progress: " + progress);
            };
            _fileReader.onload = (function (file) {
                try {
                    return function (evt) {
                        var byteArray = new Uint8Array(evt.target.result);

                        if (callback) {
                            var progress = ((currentFileIndex + 1) / totalFileCount) * 100;
                            callback({ State: "Reading", Progress: progress });
                        }

                        if (fileIsDicom(byteArray)) {

                            if (anonymousData) {
                                var dicomDataSet = dicomParser.parseDicom(byteArray);
                                var transferSyntax = dicomDataSet.string("x00020010");
                                if (transferSyntax == "1.2.840.10008.1.2") {
                                    for (var m = 0; m < anonymousData.length; m++) {
                                        var tag = anonymousData[m].Tag;
                                        var element = dicomDataSet.elements[tag];
                                        if (element) {
                                            var newValue = anonymousData[m].Value;
                                            if (newValue == "undefined")
                                                newValue = "";
                                            var newValueArray = [];
                                            for (var i = 0; i < newValue.length; i++) {
                                                newValueArray[i] = newValue.charCodeAt(i);
                                            }

                                            byteArray = replaceElementImplicit(dicomDataSet.elements, element, byteArray, newValueArray);
                                        }
                                    }
                                }
                                else {
                                    for (var m = 0; m < anonymousData.length; m++) {
                                        var tag = anonymousData[m].Tag;
                                        var element = dicomDataSet.elements[tag];
                                        if (element) {
                                            var newValue = anonymousData[m].Value;
                                            if (newValue == "undefined")
                                                newValue = "";
                                            var newValueArray = [];
                                            for (var i = 0; i < newValue.length; i++) {
                                                newValueArray[i] = newValue.charCodeAt(i);
                                            }
                                            newValueArray.push(32);

                                            var dicomVrInformation = new dicomVrInformations();
                                            var lengthAnonymous = newValueArray.length;//68
                                            if (element.vr && element.vr.length > 0) {
                                                var vrInfo = dicomVrInformation.GetVrInformation(element.vr);
                                                if (vrInfo != null) {
                                                    if (!vrInfo.MustFixLength)
                                                        lengthAnonymous = Math.min(lengthAnonymous, vrInfo.Length);
                                                }
                                            }

                                            var result = [];
                                            for (var i = 0; i < lengthAnonymous; i++) {
                                                result[i] = newValueArray[i];
                                            }

                                            byteArray = replaceElement(dicomDataSet.elements, element, byteArray, result);
                                        }
                                    }
                                }
                            }

                            //check file if exists
                            var dicomDataSet = dicomParser.parseDicom(byteArray);

                            var studyInstanceUid = dicomDataSet.string("x0020000d");
                            if (_ifExistDictionary[studyInstanceUid] == undefined || _ifExistDictionary[studyInstanceUid]) {
                                var parameters = {};
                                parameters.SessionUniqueUuid = sessionUuid;
                                parameters.InstitutionUuid = institutionUuid;
                                parameters.UserUuid = userUuid;
                                if (folderUuid != "") {
                                    parameters.FolderUuid = folderUuid;
                                }

                                parameters.StudyInstanceUid = studyInstanceUid;
                                parameters.PatientName = dicomDataSet.string("x00100010");
                                parameters.PatientId = dicomDataSet.string("x00100020");
                                parameters.SeriesInstanceUid = dicomDataSet.string("x0020000e");
                                parameters.SopInstanceUid = dicomDataSet.string("x00080018");

                                var reqMessage = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.CheckFileExist, parameters, [], userUuid);

                                _regionWebSocketClient.SendMessage(reqMessage.Encode(), function (response) {
                                    var serviceResultString = response.ApiResult;
                                    var serviceResult = JSON.parse(serviceResultString);

                                    _ifExistDictionary[serviceResult.StudyInstanceUid] = serviceResult.ResponseMessage.FileIfExist;
                                    if (!serviceResult.ResponseMessage.FileIfExist) {
                                        addToList(false, null);
                                    }
                                    else {

                                        addToList(true, serviceResult.ResponseMessage.PatientOrder);

                                        if (callback) {
                                            callback({ State: "Checking", PatientOrder: serviceResult.ResponseMessage.PatientOrder, Message: "File already exist. FileName: " + file.selectedFile.name });
                                        }

                                    }
                                });
                            }
                            else {
                                addToList(false, null);
                            }

                            function addToList(isAlreadyExist, patientOrder) {
                                var length = byteArray.length;
                                if (length < _maximumBufferLength) {
                                    var parameters = {};
                                    parameters.SessionUniqueUuid = sessionUuid;
                                    parameters.InstitutionUuid = institutionUuid;
                                    parameters.UserUuid = userUuid;
                                    parameters.FileIndex = currentFileIndex;
                                    parameters.CurrentFilePartIndex = 0;
                                    parameters.CurrentFileTotalPartCount = 1;
                                    if (folderUuid) {
                                        parameters.FolderUuidList = [];
                                        parameters.FolderUuidList.push(folderUuid);
                                    }
                                    var filePart = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessFile, parameters, byteArray, userUuid);
                                    _readedFilePartList.push(filePart);
                                }
                                else {
                                    var bufferPart = [];
                                    var currentFilePartCount = Math.ceil(length / _maximumBufferLength);
                                    var currentFilePartIndex = 0;
                                    for (var m = 0; m < length; m++) {
                                        bufferPart.push(byteArray[m]);
                                        if (bufferPart.length == _maximumBufferLength || m == length - 1) {
                                            var parameters = {};
                                            parameters.SessionUniqueUuid = sessionUuid;
                                            parameters.InstitutionUuid = institutionUuid;
                                            parameters.UserUuid = userUuid;
                                            parameters.FileIndex = currentFileIndex;
                                            parameters.CurrentFilePartIndex = currentFilePartIndex++;
                                            parameters.CurrentFileTotalPartCount = currentFilePartCount;
                                            if (folderUuid) {
                                                parameters.FolderUuidList = [];
                                                parameters.FolderUuidList.push(folderUuid);
                                            }
                                            var filePart = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessFile, parameters, bufferPart, userUuid);
                                            _readedFilePartList.push(filePart);
                                            bufferPart = [];
                                        }
                                    }
                                }

                                currentFileIndex++;
                                if (currentFileIndex < totalFileCount) {
                                    if (_readedFilePartList.length > uploaderSocketCount * 50) {
                                        var inerval = setInterval(function () {
                                            if (currentFileIndex < totalFileCount) {
                                                if (_readedFilePartList.length < uploaderSocketCount * 50) {
                                                    clearInterval(inerval);
                                                    readDicomFilesForAnnonimize(sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                                                }
                                            }
                                        }.bind(this), 300);
                                    }
                                    else {
                                        readDicomFilesForAnnonimize(sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                                    }
                                }
                                else {
                                    _readProcessIsCompleted = true;
                                }
                            }
                        }
                        else {
                            _logger.Error("Unsupported file! FileName: " + file.selectedFile.name)

                            if (callback) {
                                callback({ State: "Error", Message: "Unsupported file! FileName: " + file.selectedFile.name });
                            }

                            _totalSelectedFileSize -= file.size;

                            currentFileIndex++;
                            if (currentFileIndex < totalFileCount) {
                                readDicomFilesForAnnonimize(sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                            }
                            else {
                                _readProcessIsCompleted = true;
                            }
                        }

                    }.bind(this);
                }
                catch (e) {

                    _logger.Error("Unsupported file! FileName: " + file.selectedFile.name)

                    if (callback) {
                        callback({ State: "Error", Message: "Unsupported file! FileName: " + file.selectedFile.name });
                    }

                    _totalSelectedFileSize -= file.size;

                    currentFileIndex++;
                    if (currentFileIndex < totalFileCount) {
                        readDicomFilesForAnnonimize(sessionUuid, userUuid, institutionUuid, folderUuid, selectedFiles, currentFileIndex, totalFileCount, anonymousData, uploaderSocketCount, callback);
                    }
                    else {
                        _readProcessIsCompleted = true;
                    }
                }
            }.bind(this))(selectedFile);
            _fileReader.readAsArrayBuffer(selectedFile);
        }

        function fileIsDicom(byteArray) {
            var result = false;
            try {
                var dicomDataSet = dicomParser.parseDicom(byteArray);
                if (dicomDataSet)
                    result = true;
            }
            catch (e) {
                _logger.Error("Cannot process file.", e);
                result = false;
            }
            finally {
                byteArray = null;
            }

            return result;
        }

        function dicomVrInformations() {
            this.VrInformations = new vrInformationObject();

            this.GetVrInformation = function (vr) {
                if (this.VrInformations.VrInformationList[vr]) {
                    return this.VrInformations.VrInformationList[vr];
                }
                else
                    return null;
            }
        }

        function vrInformationObject() {
            this.VrInformationList = {};
            this.VrInformationList["AE"] = new vrInformation(false, 16);
            this.VrInformationList["AS"] = new vrInformation(true, 4);
            this.VrInformationList["AT"] = new vrInformation(true, 4);
            this.VrInformationList["CS"] = new vrInformation(false, 16);
            this.VrInformationList["DA"] = new vrInformation(true, 8);
            this.VrInformationList["DS"] = new vrInformation(false, 16);
            this.VrInformationList["DT"] = new vrInformation(false, 26);
            this.VrInformationList["FL"] = new vrInformation(true, 4);
            this.VrInformationList["FD"] = new vrInformation(true, 8);

            this.VrInformationList["IS"] = new vrInformation(false, 12);
            this.VrInformationList["LO"] = new vrInformation(false, 64);
            this.VrInformationList["LT"] = new vrInformation(false, 10240);
            this.VrInformationList["OD"] = new vrInformation(false, Math.pow(2, 32) - 8);
            this.VrInformationList["OF"] = new vrInformation(false, Math.pow(2, 32) - 4);
            this.VrInformationList["PN"] = new vrInformation(false, 64);

            this.VrInformationList["SH"] = new vrInformation(false, 16);
            this.VrInformationList["SL"] = new vrInformation(true, 4);
            this.VrInformationList["SS"] = new vrInformation(true, 2);
            this.VrInformationList["ST"] = new vrInformation(false, 1024);

            this.VrInformationList["TM"] = new vrInformation(false, 16);
            this.VrInformationList["UI"] = new vrInformation(false, 64);
            this.VrInformationList["UL"] = new vrInformation(true, 4);
            this.VrInformationList["US"] = new vrInformation(true, 2);
            this.VrInformationList["UT"] = new vrInformation(false, Math.pow(2, 32) - 2);

        }

        function vrInformation(mustFixLength, length) {
            this.MustFixLength = mustFixLength;
            this.Length = length;
        }

        function replaceElement(allElements, element, allBytes, newValueArray) {
            var oldLength = element.length;
            var newLength = newValueArray.length;
            var oldOffset = element.dataOffset;
            var diffOffset = newLength - oldLength;

            allBytes[element.dataOffset - 2] = newLength % 255;
            allBytes[element.dataOffset - 1] = 255 * Math.floor(newLength / 255);

            allBytes = deleteAndMergeArray(allBytes, oldOffset, oldLength);
            allBytes = insertAndMergeArray(allBytes, oldOffset, new Uint8Array(newValueArray));

            element.length = newLength;
            for (var key in allElements) {
                if (allElements[key].dataOffset > element.dataOffset) {
                    allElements[key].dataOffset += diffOffset;
                }
            }

            return allBytes;

            function deleteAndMergeArray(uint8Array, startPosition, sliceLength) {
                var frontValues = new Uint8Array(uint8Array.buffer, 0, startPosition);
                var backValues = new Uint8Array(uint8Array.buffer, startPosition + sliceLength);
                var mergedArray = new Uint8Array(frontValues.length + backValues.length);

                mergedArray.set(frontValues);
                mergedArray.set(backValues, startPosition);

                return new Uint8Array(mergedArray.buffer);
            }

            function insertAndMergeArray(uint8Array, insertPosition, insertArray) {
                var frontValues = new Uint8Array(uint8Array.buffer, 0, insertPosition);
                var backValues = new Uint8Array(uint8Array.buffer, insertPosition);
                var newValues = insertArray;
                var mergedArray = new Uint8Array(frontValues.length + insertArray.length + backValues.length);

                mergedArray.set(frontValues);
                mergedArray.set(insertArray, insertPosition)
                mergedArray.set(backValues, (insertPosition + insertArray.length));

                return new Uint8Array(mergedArray.buffer);
            }
        }
        function replaceElementImplicit(allElements, element, allBytes, newValueArray) {
            var oldLength = element.length;
            var newLength = newValueArray.length;
            var oldOffset = element.dataOffset;
            var diffOffset = newLength - oldLength;

            allBytes[element.dataOffset - 4] = newLength % 255;

            allBytes = deleteAndMergeArray(allBytes, oldOffset, oldLength);
            allBytes = insertAndMergeArray(allBytes, oldOffset, new Uint8Array(newValueArray));

            element.length = newLength;
            for (var key in allElements) {
                if (allElements[key].dataOffset > element.dataOffset) {
                    allElements[key].dataOffset += diffOffset;
                }
            }

            return allBytes;

            function deleteAndMergeArray(uint8Array, startPosition, sliceLength) {
                var frontValues = new Uint8Array(uint8Array.buffer, 0, startPosition);
                var backValues = new Uint8Array(uint8Array.buffer, startPosition + sliceLength);
                var mergedArray = new Uint8Array(frontValues.length + backValues.length);

                mergedArray.set(frontValues);
                mergedArray.set(backValues, startPosition);

                return new Uint8Array(mergedArray.buffer);
            }

            function insertAndMergeArray(uint8Array, insertPosition, insertArray) {
                var frontValues = new Uint8Array(uint8Array.buffer, 0, insertPosition);
                var backValues = new Uint8Array(uint8Array.buffer, insertPosition);
                var newValues = insertArray;
                var mergedArray = new Uint8Array(frontValues.length + insertArray.length + backValues.length);

                mergedArray.set(frontValues);
                mergedArray.set(insertArray, insertPosition)
                mergedArray.set(backValues, (insertPosition + insertArray.length));

                return new Uint8Array(mergedArray.buffer);
            }
        }
    }


    function fileIsDocument(extention) {
        return true;
    }

    function readAndSendDocumentFile(sessionUuid, userUuid, institutionUuid, patientOrderUuid, selectedFiles, currentFileIndex, totalFileCount, callback) {
        var selectedFile = selectedFiles[currentFileIndex];

        var reader = new FileReader();
        reader.onabort = function (e) { };
        reader.onloadstart = function (e) { };
        reader.onprogress = function (evt) {
            if (callback) {
                var progress = 100 * evt.loaded / evt.total;
                callback({ State: "Reading", FileIndex: currentFileIndex, Progress: progress });
            }
        };
        reader.onload = (function (file) {
            try {
                return function (evt) {
                    var byteArray = new Uint8Array(evt.target.result);

                    if (fileIsDocument(file.type)) {

                        var length = byteArray.length;
                        var readedFilePartList = [];
                        if (length < _maximumBufferLength) {
                            var parameters = {};
                            parameters.SessionUniqueUuid = sessionUuid;
                            parameters.InstitutionUuid = institutionUuid;
                            parameters.UserUuid = userUuid;
                            parameters.FileIndex = currentFileIndex;
                            parameters.CurrentFilePartIndex = 0;
                            parameters.CurrentFileTotalPartCount = 1;
                            parameters.PatientOrderUuid = patientOrderUuid;
                            parameters.FileName = file.name;
                            parameters.FileType = file.type;
                            parameters.IsDocument = true;
                            var filePart = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessDocuments, parameters, byteArray, userUuid);
                            readedFilePartList.push(filePart);
                        }
                        else {
                            var bufferPart = [];
                            var currentFilePartCount = Math.ceil(length / _maximumBufferLength);
                            var currentFilePartIndex = 0;
                            for (var m = 0; m < length; m++) {
                                bufferPart.push(byteArray[m]);
                                if (bufferPart.length == _maximumBufferLength || m == length - 1) {

                                    var parameters = {};
                                    parameters.SessionUniqueUuid = sessionUuid;
                                    parameters.InstitutionUuid = institutionUuid;
                                    parameters.UserUuid = userUuid;
                                    parameters.FileIndex = currentFileIndex;
                                    parameters.TotalFileCount = totalFileCount;
                                    parameters.CurrentFilePartIndex = currentFilePartIndex++;
                                    parameters.CurrentFileTotalPartCount = currentFilePartCount;
                                    parameters.FileBuffer = bufferPart;
                                    parameters.PatientOrderUuid = patientOrderUuid;
                                    parameters.FileName = file.name;
                                    parameters.FileType = file.type;
                                    parameters.IsDocument = true;
                                    var filePart = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessDocuments, parameters, byteArray, userUuid);
                                    readedFilePartList.push(filePart);
                                    bufferPart = [];
                                }
                            }
                        }

                        //send file
                        var readedFilePartListIndex = 0;
                        sendDocumentFilesToServer();

                        function sendDocumentFilesToServer() {
                            _regionWebSocketClient.SendMessage(readedFilePartList[readedFilePartListIndex].Encode(), function (response) {
                                var serviceResultString = response.ApiResult;
                                var serviceResult = JSON.parse(serviceResultString);
                                if (serviceResult.ResponseCode == 1) {

                                    if (callback) {
                                        var progress = 100 * (readedFilePartListIndex + 1) / readedFilePartList.length;
                                        callback({ State: "Sending", FileIndex: currentFileIndex, Progress: progress });
                                    }

                                    readedFilePartListIndex++;
                                    if (readedFilePartListIndex < readedFilePartList.length) {
                                        sendDocumentFilesToServer();
                                    }
                                    else {
                                        currentFileIndex++;
                                        if (currentFileIndex < totalFileCount) {
                                            readAndSendDocumentFile(sessionUuid, userUuid, institutionUuid, patientOrderUuid, selectedFiles, currentFileIndex, totalFileCount, callback);
                                        }
                                        if (totalFileCount == 1 && currentFileIndex == totalFileCount) {
                                            if (callback) {
                                                callback({ State: "File Upload Completed", Progress: 100, PatientOrder: serviceResult.ResponseMessage.PatientOrder });
                                            }
                                        }
                                        else {
                                            var lastParameters = {};
                                            lastParameters.SessionUniqueUuid = sessionUuid;
                                            lastParameters.InstitutionUuid = institutionUuid;
                                            lastParameters.UserUuid = userUuid;
                                            lastParameters.FileIndex = 0;
                                            lastParameters.TotalFileCount = 0;
                                            lastParameters.CurrentFilePartIndex = 0;
                                            lastParameters.CurrentFileTotalPartCount = 0;
                                            lastParameters.FileBuffer = [];
                                            lastParameters.PatientOrderUuid = patientOrderUuid;
                                            lastParameters.FileName = file.name;
                                            lastParameters.FileType = file.type;
                                            lastParameters.IsDocument = true;
                                            var lastMessage = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.ProcessDocuments, parameters, byteArray, userUuid);
                                            _regionWebSocketClient.SendMessage(lastMessage.Encode(), function (response) {
                                                var serviceResultString = response.ApiResult;
                                                var serviceResult = JSON.parse(serviceResultString);
                                                if (serviceResult.ResponseCode == 1) {
                                                    if (callback) {
                                                        callback({ State: "File Upload Completed", Progress: 100, PatientOrder: serviceResult.ResponseMessage.PatientOrder });
                                                    }
                                                }
                                                else {
                                                    _logger.Error("Error while attach document!");
                                                    callback({ State: serviceResult.Message });
                                                }
                                            });
                                        }
                                    }
                                }
                                else {
                                    _logger.Error("Error while sending files!");
                                    callback({ State: serviceResult.Message });
                                }
                            });
                        }
                    }
                    else {
                        _logger.Error("Unsupported file! FileName: " + file.name)
                        currentFileIndex++;
                        if (currentFileIndex < totalFileCount) {
                            readAndSendDocumentFile(sessionUuid, userUuid, institutionUuid, patientOrderUuid, selectedFiles, currentFileIndex, totalFileCount, callback);
                        }
                        else {
                            if (callback) {
                                callback({ State: "File Upload Completed" });
                            }
                        }
                    }

                }.bind(this);
            }
            catch (e) {

            }
        }.bind(this))(selectedFile);
        reader.readAsArrayBuffer(selectedFile);
    }

    function uploadDocumentFiles(userUuid, institutionUuid, patientOrderUuid, selectedFiles, callback) {
        if (_initialized) {
            var fileSize = 0;
            for (var i = 0; i < selectedFiles.length; i++) {
                fileSize += selectedFiles[i].size;
            }

            var parameters = {};
            parameters.UserUuid = userUuid;
            parameters.InstitutionUuid = institutionUuid;
            parameters.TotalFileSize = fileSize / 1024;
            parameters.UploaderUuid = userUuid;
            parameters.UploaderName = GetUsernameFromUuid(userUuid) + " - API";
            var uploadMessage = new ApiFileUploadRequestMessage(FileUploadMessageManagementTypes.Initialize, parameters, [], userUuid);
            if (_regionWebSocketClient) {
                _regionWebSocketClient.SendMessage(uploadMessage.Encode(), function (response) {
                    var serviceResultString = response.ApiResult;
                    var serviceResult = JSON.parse(serviceResultString);
                    if (serviceResult.ResponseCode == 1) {
                        readAndSendDocumentFile(serviceResult.SessionUniqueUuid, userUuid, institutionUuid, patientOrderUuid, selectedFiles, 0, selectedFiles.length, callback);
                    }
                    else {
                        if (callback) {
                            callback(serviceResult);
                        }
                    }
                });
            }
        }
        else {
            _logger.Error("Please initialize api before send message!");
        }
    }

    function readDicomTags(dicomFile, callback) {
        if (dicomFile.name.indexOf("DICOMDIR") <= -1) {
            var reader = new FileReader();
            reader.onabort = function (e) { };
            reader.onloadstart = function (e) { };
            reader.onprogress = function (evt) { };
            reader.onload = (function (file) {
                try {
                    return function (evt) {
                        try {
                            var byteArray = new Uint8Array(evt.target.result);
                            var dicomDataSet = dicomParser.parseDicom(byteArray);
                            if (dicomDataSet)
                                callback(dicomDataSet);
                            else
                                _logger.Error("Unsupported file! FileName: " + dicomFile.name)
                        }
                        catch (e) {
                            callback(null);
                        }
                    }.bind(this);
                }
                catch (e) {
                    throw e;
                }
            }.bind(this))(dicomFile);
            reader.readAsArrayBuffer(dicomFile);
        }
    }

    function sendGeneralRequestMessage(generalRequestMessage, callback) {
        if (_initialized) {
            _regionWebSocketClient.SendMessage(generalRequestMessage.Encode(), function (response) {
                var serviceResultString = response.ApiResult;
                var serviceResult = JSON.parse(serviceResultString);
                if (serviceResult) {
                    if (callback) {
                        callback(serviceResult.ResponseMessage);
                    }
                    else {
                        _logger.Error("Callback method undefined!");
                    }
                }
                else {
                    _logger.Error("Error while processing message. Error Message: " + serviceResult.Message);
                }
            });
        }
        else {
            _logger.Error("Please initialize api before send message!");
        }
    }
    //#endregion

    //#region Helper objects
    this.ReadDicomFiles = function (selectedFiles, callback) {
        if (selectedFiles.length > 0) {
            var fileIndex = 0;
            var fileCount = selectedFiles.length;
            var result = new dicomInformation();

            readAllFiles(this.DicomTagsEnum);
            function readAllFiles(dicomTagsEnum) {
                try {
                    readDicomTags(selectedFiles[fileIndex], function (dicomDataSet) {
                        if (dicomDataSet != null) {
                            var study = new studyDicom();
                            study.PatientName = dicomDataSet.string(dicomTagsEnum.PatientName);
                            study.OtherPatientName = dicomDataSet.string(dicomTagsEnum.OtherPatientName);
                            study.PatientId = dicomDataSet.string(dicomTagsEnum.PatientId);
                            study.OtherPatientId = dicomDataSet.string(dicomTagsEnum.OtherPatientId);
                            study.StudyDescription = dicomDataSet.string(dicomTagsEnum.StudyDescription);
                            study.ReferringPhysicianName = dicomDataSet.string(dicomTagsEnum.ReferringPhysicianName);
                            study.InstitutionName = dicomDataSet.string(dicomTagsEnum.InstitutionName);
                            study.InstitutionAddress = dicomDataSet.string(dicomTagsEnum.InstitutionAddress);
                            study.AccessionNumber = dicomDataSet.string(dicomTagsEnum.AccessionNumber);
                            study.Modality = dicomDataSet.string("x00080060");
                            study.StudyDate = dicomDataSet.string("x00080020");
                            study.StudyInstanceUid = dicomDataSet.string("x0020000d");
                            study.TransferSyntaxUid = dicomDataSet.string("x00020010");

                            var series = new seriesDicom();
                            series.SeriesDate = dicomDataSet.string("x00080021");
                            series.SeriesInstanceUid = dicomDataSet.string("x0020000e");

                            var image = new imageDicom();
                            image.SopInstanceUid = dicomDataSet.string("x00080018");

                            var stdy = null;
                            var serie = null;
                            var img = null;

                            for (var i = 0; i < result.StudyList.length; i++) {
                                if (result.StudyList[i].StudyInstanceUid == study.StudyInstanceUid) {
                                    stdy = result.StudyList[i];
                                }
                            }
                            if (stdy) {
                                for (var i = 0; i < stdy.SeriesList.length; i++) {
                                    if (stdy.SeriesList[i].SeriesInstanceUid == series.SeriesInstanceUid) {
                                        serie = stdy.SeriesList[i];
                                    }
                                }
                                if (serie) {
                                    for (var i = 0; i < serie.ImageList.length; i++) {
                                        if (serie.ImageList[i].SopInstanceUid == image.SopInstanceUid) {
                                            img = serie.ImageList[i];
                                        }
                                    }
                                    if (img) {
                                        result.Message = "Selected files include same SopInstanceUuid";
                                        callback(result);
                                        _logger.Error("Selected files include same SopInstanceUid");
                                    }
                                    else {
                                        stdy.ImageList.push(image);
                                        serie.ImageList.push(image);
                                        stdy.FileList.push(selectedFiles[fileIndex]);
                                    }
                                }
                                else {
                                    stdy.ImageList.push(image);
                                    series.ImageList.push(image);
                                    stdy.SeriesList.push(series);
                                    stdy.FileList.push(selectedFiles[fileIndex]);
                                }
                            }
                            else {
                                study.ImageList.push(image);
                                series.ImageList.push(image);
                                study.SeriesList.push(series);
                                study.FileList.push(selectedFiles[fileIndex]);
                                result.StudyList.push(study);
                            }

                            fileIndex++;
                            if (fileIndex < fileCount) {
                                result.Message = "Reading...";
                                result.Progress = 100 * fileIndex / fileCount;
                                callback(result);
                                readAllFiles(dicomTagsEnum);
                            }
                            else {
                                result.Message = "Completed";
                                result.Progress = 100;
                                callback(result);
                            }
                        }
                        else {

                            if (callback) {
                                callback({ State: "Error", Message: "Unsupported file! FileName: " + selectedFiles[fileIndex].name });
                            }

                            fileIndex++;
                            if (fileIndex < fileCount) {
                                result.Message = "Reading...";
                                result.Progress = 100 * fileIndex / fileCount;
                                callback(result);
                                readAllFiles(dicomTagsEnum);
                            }
                            else {
                                result.Message = "Completed";
                                result.Progress = 100;
                                callback(result);
                            }
                        }
                    }.bind(this));

                } catch (e) {
                    fileIndex++;
                    if (fileIndex < fileCount) {
                        result.Message = "Reading...";
                        result.Progress = 100 * fileIndex / fileCount;
                        callback(result);
                        readAllFiles(dicomTagsEnum);
                    }
                    else {
                        result.Message = "Completed";
                        result.Progress = 100;
                        callback(result);
                    }
                }
            }
        }
    }
    this.DicomTagsEnum = Object.freeze({
        PatientName: "x00100010",
        PatientId: "x00100020",
        OtherPatientId: "x00101000",
        OtherPatientName: "x00101001",

        StudyDescription: "x00081030",
        ReferringPhysicianName: "x00080090",
        InstitutionName: "x00080080",
        InstitutionAddress: "x00080081",
        AccessionNumber: "x00080050"
    });
    function GetPatientOrderJsonParameters(jsonParameters) {
        var result = {};
        result.IdentityInformation = {};
        result.StudyInformation = {};
        result.OtherInformation = {};
        if (jsonParameters.OtherPatientId) {
            result.IdentityInformation.OtherId = jsonParameters.OtherPatientId;
        }
        if (jsonParameters.PatientName) {
            result.IdentityInformation.Name = jsonParameters.PatientName;
        }
        if (jsonParameters.OrderModality) {
            result.Modality = jsonParameters.OrderModality;
        }
        if (jsonParameters.OrderAccessionNumber) {
            result.AccessionNumber = jsonParameters.OrderAccessionNumber;
        }
        if (jsonParameters.PatientsBirthDate) {
            result.IdentityInformation.Birthdate = jsonParameters.PatientsBirthDate;
        }
        if (jsonParameters.PatientID) {
            result.IdentityInformation.Id = jsonParameters.PatientID;
        }
        if (jsonParameters.RequestingPhysician) {
            result.OtherInformation.RequestingPhysician = jsonParameters.RequestingPhysician;
        }
        if (jsonParameters.RequestingProcedureDescription) {
            result.OtherInformation.RequestedProcedureDescription = jsonParameters.RequestingProcedureDescription;
        }
        if (jsonParameters.PerformedDatetime) {
            result.StudyInformation.StudyDate = jsonParameters.PerformedDatetime;
        }
        if (jsonParameters.ReferringPhysiciansName) {
            result.OtherInformation.ReferringPhysiciansName = jsonParameters.ReferringPhysiciansName;
        }
        if (jsonParameters.StudyDescription) {
            result.StudyInformation.StudyDescription = jsonParameters.StudyDescription;
        }
        if (jsonParameters.RequestedProcedureId) {
            result.OtherInformation.RequestedProcedureId = jsonParameters.RequestedProcedureId;
        }
        if (jsonParameters.ScheduledEquipmentUuid) {
            result.ScheduledEquipmentUuid = jsonParameters.ScheduledEquipmentUuid;
        }
        if (jsonParameters.PatientSex) {
            result.IdentityInformation.Sex = jsonParameters.PatientSex;
        }
        if (jsonParameters.InstitutionNameInDicom) {
            result.StudyInformation.InstitutionNameInDicom = jsonParameters.InstitutionNameInDicom;
        }

        return result;
    }
    function GetFolderJsonParameters(jsonParameters) {
        var result = {};
        result.IdentityInformation = {};
        if (jsonParameters.FolderName) {
            result.IdentityInformation.Name = jsonParameters.FolderName;
        }
        if (jsonParameters.FolderDescription) {
            result.IdentityInformation.Description = jsonParameters.FolderDescription;
        }

        return result;
    }
    function ValidateParameters(parameterList, callback) {
        var result = true;

        if (parameterList.length > 0) {
            for (var i = 0; i < parameterList.length; i++) {
                switch (parameterList[i].Type) {
                    case "guid":
                        {
                            if (parameterList[i].Value != _guidEmpty && !GuidIsValid(parameterList[i].Value)) {
                                result = false;
                                break;
                            }
                        }
                        break;
                    case "guidList":
                        {
                            if (parameterList[i].Value) {
                                for (var j = 0; j < parameterList[i].Value.length; j++) {
                                    if (parameterList[i].Value[j] != _guidEmpty && !GuidIsValid(parameterList[i].Value[j])) {
                                        result = false;
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    case "date":
                        {
                            if (!DateIsValid(parameterList[i].Value)) {
                                result = false;
                                break;
                            }
                        }
                        break;
                    case "time":
                        {
                            if (!TimeIsValid(parameterList[i].Value)) {
                                result = false;
                                break;
                            }
                        }
                        break;
                    case "mail":
                        {
                            if (parameterList[i].Value && !EmailIsValid(parameterList[i].Value)) {
                                result = false;
                                break;
                            }
                        }
                        break;
                    case "int":
                        {
                            if (parameterList[i].Value) {
                                result = Number.isInteger(parameterList[i].Value);
                                break;
                            }
                        }
                        break;
                    default:
                        break;
                }

                if (!result) {
                    var errorMessage = "Invalid parameters for " + parameterList[i].Name + ". Given value = '" + parameterList[i].Value + "' is not " + parameterList[i].Type + " format.";
                    console.error(errorMessage);

                    if (callback) {
                        callback({ Success: false, Message: errorMessage });
                    }

                    break;
                }
            }
        }
        else {
            result = true;
        }

        return result;
    }
    function GuidIsValid(guidString) {
        var validationString = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return validationString.test(guidString);
    }
    function EmailIsValid(emailAdress) {
        var validationString = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return validationString.test(emailAdress);
    }
    function DateIsValid(dateString) {
        var regEx = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateString.match(regEx)) return false;  // Invalid format
        var d = new Date(dateString);
        var dNum = d.getTime();
        if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
        return d.toISOString().slice(0, 10) === dateString;
    }
    function TimeIsValid(timeString) {
        var validationString = /^\d{2}:\d{2}$/;
        return validationString.test(timeString);
    }
    function GetUsernameFromUuid(userUuid) {
        var username = "";
        if (_account && _account.UserList) {
            var user = _account.UserList.find(u => u.UserUuid == userUuid);
            if (user) {
                username = user.FullName;
            }
        }
        return username;
    }
    const GeneralMessageManagementTypes = {
        None: 0,
        SearchPatientOrder: 1,
        CreateFolder: 2,
        SearchFolder: 3,
        DeleteFolder: 4,
        GetViewUrl: 5,
        DeletePatientOrder: 6,
        CreatePatientOrder: 7,
        AddOrderToFolder: 8,
        RemoveOrderFromFolder: 9,
        CreateOrderGroup: 10,
        AddOrdersToOrderGroup: 11,
        RemoveOrdersFromGroup: 12,
        GetPatientOrderProperties: 13,
        ShareFolderWithEmail: 14,
        ShareFolderWithURL: 15,
        ShareFolderToUploadWithEmail: 16,
        ShareFolderToUploadWithUrl: 17,
        ShareFolderWithAccountUser: 18,
        ShareFolderWithAccountUserGroup: 19,
        SharePatientOrderWithEmail: 20,
        SharePatientOrderWithUrl: 21,
        GetUserGroupList: 22,
        GetDicomNodeList: 23,
        GetContactList: 24,
        CreatePatientOrderWithJson: 25,
        GetFolderViewUrl: 26,
        UpdateFolderWithJson: 27,
        AssignPatientOrderToUser: 28,
        AssignPatientOrderToUserGroup: 29,
        GetAccountFlagDictionary: 30,
        SetFlagToPatientOrder: 31,
        UnassignPatientOrderFromUser: 32,
        UnassignPatientOrderFromUserGroup: 33,
        GetUserList: 34,
        AssignPatientOrderToInstitution: 35,
        SharePatientOrderWithEmailWithExpireDate: 36,
        SharePatientOrderWithUrlWithExpireDate: 37
    }
    const SessionManagementMessageManagementTypes = {
        None: 0,
        CreateSession: 1,
        RegisterSession: 2,
        ForceRegister: 3,
        CreateApiSession: 4
    }
    const FileUploadMessageManagementTypes = {
        None: 0,
        Initialize: 1,
        CheckFileExist: 2,
        ProcessFile: 3,
        ProcessDocuments: 4,
        AttachDocument: 5,
        Cancel: 6,
        Error: 7
    }
    function dicomInformation() {
        this.Message = "";
        this.Progress = 0;
        this.StudyList = [];
    }
    function studyDicom() {
        this.PatientName = "";
        this.OtherPatientName = "";
        this.PatientId = "";
        this.OtherPatientId = "";
        this.AccessionNumber = "";
        this.Modality = "";
        this.StudyDate = "";
        this.StudyInstanceUid = "";
        this.StudyDescription = "";
        this.ReferringPhysicianName = "";
        this.InstitutionName = "";
        this.InstitutionAddress = "";
        this.TransferSyntaxUid = "";

        this.SeriesList = [];
        this.FileList = [];
        this.ImageList = [];
    }
    function seriesDicom() {
        this.SeriesDate = "";
        this.SeriesInstanceUid = "";

        this.ImageList = [];
    }
    function imageDicom() {
        this.SopInstanceUid = "";
    }
    //#endregion

    //#region Libraries
    var GlobalMessageID = 1;
    var defaultEncodingType = "utf-8";
    function RequestMessage(MessageType, buflen) {
        this.MessageType = MessageType;
        this.MessageID = GlobalMessageID++;
        this.Buffer = new ArrayBuffer(buflen + 6);

        this.view = new DataView(this.Buffer);
        this.view.setUint16(0, MessageType, true);     // 2 
        this.view.setUint32(2, this.MessageID, true);  // 4
        this.viewPosition = 6;

        this.GetTicksFromDate = function (date) {
            if (!(date instanceof Date)) {
                date = new Date(date);
            }

            var dateFirst = new Date("1/1/1900");
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            var timeDiff = (date.valueOf() - dateFirst.valueOf());
            var dateDiffMinutes = (timeDiff / (1000 * 60)) - date.getTimezoneOffset() + dateFirst.getTimezoneOffset();
            return dateDiffMinutes;
        }
        this.AddString = function (textstr) {
            var chararray = textstr;
            if (chararray) {
                this.AddByte(chararray.length);
                for (var i = 0; i < chararray.length; ++i) {
                    this.view.setUint8(this.viewPosition + i, chararray[i]);
                }
                this.viewPosition = this.viewPosition + chararray.length;
            }
            else {
                this.AddByte(0);
            }

        }
        this.AddBlob = function (textstr) {
            var chararray = textstr;
            if (chararray) {
                this.AddInt32(chararray.length);
                for (var i = 0; i < chararray.length; ++i) {
                    this.view.setUint8(this.viewPosition + i, chararray[i]);
                }
                this.viewPosition = this.viewPosition + chararray.length;
            }
            else {
                this.AddInt32(0);
            }
        }
        this.AddByteArray = function (bytearray, startindex, endindex) {
            this.view.setInt32(this.viewPosition, endindex - startindex, true);

            this.viewPosition = this.viewPosition + 4;
            for (var i = startindex; i < endindex; i++) {

                this.view.setUint8(this.viewPosition, bytearray[i]);
                this.viewPosition = this.viewPosition + 1;
            }
        }
        this.AddInt16 = function (value) {
            this.view.setInt16(this.viewPosition, value, true);
            this.viewPosition = this.viewPosition + 2;
        }
        this.AddInt32 = function (value) {
            this.view.setInt32(this.viewPosition, value, true);
            this.viewPosition = this.viewPosition + 4;
        }
        this.AddUint32 = function (value) {
            this.view.setUint32(this.viewPosition, value, true);
            this.viewPosition = this.viewPosition + 4;
        }
        this.AddByte = function (value) {
            this.view.setUint8(this.viewPosition, value);
            this.viewPosition = this.viewPosition + 1;
        }
        this.AddFloat32 = function (value) {
            this.view.setFloat32(this.viewPosition, value, true);
            this.viewPosition = this.viewPosition + 4;
        }
        this.AddFloat64 = function (value) {
            this.view.setFloat64(this.viewPosition, value, true);
            this.viewPosition = this.viewPosition + 8;
        }
    }
    function ResponseMessage(buffer) {
        this.ReadString = function ReadString(encodingType) {
            if (encodingType) {
                var length = this.ReadUint8();
                if (length > 0) {
                    var arr = new Uint8Array(buffer, this.viewPosition, length);
                    this.viewPosition += length * 1;
                    return (new TextDecoder(encodingType)).decode(arr);
                }
            }
            else {
                var length = this.ReadUint8();
                if (length > 0) {
                    var arr = new Uint8Array(buffer, this.viewPosition, length);
                    this.viewPosition += length * 1;
                    return (new TextDecoder(defaultEncodingType)).decode(arr);
                }
            }
            return "";
        }
        this.ReadBlob = function ReadBlob(encodingType) {
            if (encodingType) {
                var length = this.ReadInt32();
                if (length > 0) {
                    var arr = new Uint8Array(buffer, this.viewPosition, length);
                    this.viewPosition += length * 1;
                    return (new TextDecoder(encodingType)).decode(arr);
                }
            }
            else {
                var length = this.ReadInt32();
                if (length > 0) {
                    var arr = new Uint8Array(buffer, this.viewPosition, length);
                    this.viewPosition += length * 1;
                    return (new TextDecoder(defaultEncodingType)).decode(arr);
                }
            }
            return "";
        }
        this.ReadInt32 = function ReadInt32() {
            var int32 = this.dataView.getInt32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            return int32;
        }
        this.ReadDate = function ReadDate() {
            /*TODO: Yasar burada long formatından tarih okuman lazım*/
            var date = this.dataView.getFloat64(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 8;
            return date;
        }
        this.ReadUint32 = function ReadUint32() {
            var uint32 = this.dataView.getUint32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            return uint32;
        }
        this.ReadFloat32 = function ReadFloat32() {
            var float32 = this.dataView.getFloat32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            return float32;
        }
        this.ReadFloat64 = function ReadFloat64() {
            var float64 = this.dataView.getFloat64(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 8;
            return float64;
        }
        this.ReadDoubleArray = function ReadDoubleArray() {
            var dblarr = [];
            var cnt = this.dataView.getInt32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            for (var i = 0; i < cnt; i++) {
                var float64 = this.dataView.getFloat64(this.viewPosition, true);
                this.viewPosition = this.viewPosition + 8;
                dblarr.push(float64);
            }
            return dblarr;
        }
        this.ReadFloatArray = function ReadFloatArray() {
            var fltarr = [];
            var cnt = this.dataView.getInt32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            for (var i = 0; i < cnt; i++) {
                var float32 = this.dataView.getFloat32(this.viewPosition, true);
                this.viewPosition = this.viewPosition + 4;
                fltarr.push(float32);
            }
            return fltarr;
        }
        this.ReadIntArray = function ReadIntArray() {
            var intarr = [];
            var cnt = this.dataView.getUint32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            for (var i = 0; i < cnt; i++) {
                var int32 = this.dataView.getInt32(this.viewPosition, true);
                this.viewPosition = this.viewPosition + 4;
                intarr.push(int32);
            }
            return intarr;
        }
        this.ReadStringArray = function ReadStringArray() {
            var strarr = [];
            var cnt = this.dataView.getUint32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            for (var i = 0; i < cnt; i++) {
                strarr.push(this.ReadString());
            }
            return strarr;
        }
        this.ReadUint8 = function ReadUint8() {

            var uint8 = this.dataView.getUint8(this.viewPosition);
            this.viewPosition = this.viewPosition + 1;
            return uint8;
        }
        this.ReadUint16 = function ReadUint16() {
            var uint16 = this.dataView.getUint16(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 2;
            return uint16;
        }
        this.ReadByteArray = function ReadByteArray() {

            var ResponsebufferLength = this.dataView.getUint32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            var ImageBuffer = new ArrayBuffer(ResponsebufferLength);
            var ImageBufferMessage = new DataView(ImageBuffer);

            for (var i = 0; i < ResponsebufferLength; ++i) {
                ImageBufferMessage.setUint8(i, this.dataView.getUint8(this.viewPosition + i));
            }
            this.viewPosition = this.viewPosition + ResponsebufferLength;
            return ImageBuffer;
        }
        this.ReadByteArray2 = function ReadByteArray2() {
            var bytearr = [];
            var cnt = this.dataView.getUint32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;
            for (var i = 0; i < cnt; i++) {
                var bt = this.dataView.getUint8(this.viewPosition);
                this.viewPosition = this.viewPosition + 1;
                bytearr.push(bt);
            }
            return bytearr;
        }
        this.ReadByteArray3 = function ReadByteArray2() {



            var length = this.dataView.getUint32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;


            var arr = new Uint8Array(buffer, this.viewPosition, length);

            this.viewPosition = this.viewPosition + length;


            var base64 = '',
                encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

                /*bytes = new Uint8Array(arrayBuffer),*/
                /*byteLength = bytes.byteLength,*/
                byteLength = length,
                byteRemainder = byteLength % 3, mainLength = byteLength - byteRemainder,
                a, b, c, d, chunk;

            for (var i = 0; i < mainLength; i = i + 3) {
                chunk = (arr[i] << 16) | (arr[i + 1] << 8) | arr[i + 2];
                a = (chunk & 16515072) >> 18; b = (chunk & 258048) >> 12;
                c = (chunk & 4032) >> 6; d = chunk & 63;
                base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
            }

            if (byteRemainder == 1) {
                chunk = arr[mainLength];
                a = (chunk & 252) >> 2;
                b = (chunk & 3) << 4;
                base64 += encodings[a] + encodings[b] + '==';
            } else if (byteRemainder == 2) {
                chunk = (arr[mainLength] << 8) | arr[mainLength + 1];
                a = (chunk & 16128) >> 8;
                b = (chunk & 1008) >> 4;
                c = (chunk & 15) << 2;
                base64 += encodings[a] + encodings[b] + encodings[c] + '=';
            }
            /*console.log("buffer size = " + base64.length);*/
            return "data:image/jpeg;base64," + base64;
        }
        this.ReadByteArray4 = function ReadByteArray3() {
            var length = this.dataView.getUint32(this.viewPosition, true);
            this.viewPosition = this.viewPosition + 4;


            var arr = new Uint8Array(buffer, this.viewPosition, length);

            this.viewPosition = this.viewPosition + length;


            var base64 = '',
                /*encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',*/
                byteLength = length,
                byteRemainder = byteLength % 3, mainLength = byteLength - byteRemainder,
                a, b, c, d, chunk;


            /*for (var i = 0; i < encodings.length; i++)*/
            /*    console.log(encodings[i] + " : " + encodings.charCodeAt(i));*/

            var encodingBytes = new Uint8Array([65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
                97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
                120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47]);
            var resultArrayLength = (mainLength / 3 + byteRemainder) * 4 + 23; /* 23 is the length of "data:image/jpeg;base64,"*/
            var resultArray = new Uint8Array(resultArrayLength);

            var resultArrayIndex = 0;
            /* "data:image/jpeg;base64," charcodes*/
            resultArray[resultArrayIndex++] = 100;
            resultArray[resultArrayIndex++] = 97; resultArray[resultArrayIndex++] = 116; resultArray[resultArrayIndex++] = 97; resultArray[resultArrayIndex++] = 58; resultArray[resultArrayIndex++] = 105;
            resultArray[resultArrayIndex++] = 109; resultArray[resultArrayIndex++] = 97; resultArray[resultArrayIndex++] = 103; resultArray[resultArrayIndex++] = 101; resultArray[resultArrayIndex++] = 47;
            resultArray[resultArrayIndex++] = 106; resultArray[resultArrayIndex++] = 112; resultArray[resultArrayIndex++] = 101; resultArray[resultArrayIndex++] = 103; resultArray[resultArrayIndex++] = 59;
            resultArray[resultArrayIndex++] = 98; resultArray[resultArrayIndex++] = 97; resultArray[resultArrayIndex++] = 115; resultArray[resultArrayIndex++] = 101; resultArray[resultArrayIndex++] = 54;
            resultArray[resultArrayIndex++] = 52; resultArray[resultArrayIndex++] = 44;

            for (var i = 0; i < mainLength; i = i + 3) {
                chunk = (arr[i] << 16) | (arr[i + 1] << 8) | arr[i + 2];
                a = (chunk & 16515072) >> 18; b = (chunk & 258048) >> 12;
                c = (chunk & 4032) >> 6; d = chunk & 63;
                resultArray[resultArrayIndex++] = encodingBytes[a];
                resultArray[resultArrayIndex++] = encodingBytes[b];
                resultArray[resultArrayIndex++] = encodingBytes[c];
                resultArray[resultArrayIndex++] = encodingBytes[d];
            }

            if (byteRemainder == 1) {
                chunk = arr[mainLength];
                a = (chunk & 252) >> 2;
                b = (chunk & 3) << 4;
                resultArray[resultArrayIndex++] = encodingBytes[a];
                resultArray[resultArrayIndex++] = encodingBytes[b];
                resultArray[resultArrayIndex++] = 61;
                resultArray[resultArrayIndex++] = 61;
            } else if (byteRemainder == 2) {
                chunk = (arr[mainLength] << 8) | arr[mainLength + 1];
                a = (chunk & 16128) >> 8;
                b = (chunk & 1008) >> 4;
                c = (chunk & 15) << 2;
                resultArray[resultArrayIndex++] = encodingBytes[a];
                resultArray[resultArrayIndex++] = encodingBytes[b];
                resultArray[resultArrayIndex++] = encodingBytes[c];
                resultArray[resultArrayIndex++] = 61;
            }

            var mybase64 = (new TextDecoder('utf-8')).decode(resultArray);

            return mybase64;
        }

        this.buffer = buffer;
        this.dataView = new DataView(this.buffer);
        this.viewPosition = 0;

        this.ResponseMessageType = this.ReadUint16();
        this.MessageId = this.ReadUint32();
        this.RequestedId = this.ReadUint32();
        this.IsSuccess = this.ReadUint8() == 1;
        this.Message = this.ReadBlob();
    }
    //#endregion
}