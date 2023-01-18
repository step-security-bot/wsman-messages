/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
***********************************************************************/

import type { AMT, CIM, IPS } from '.'

export interface Selector {
  name: string | undefined
  value: string | undefined
}

export enum WSManErrors {
  HEADER = 'missing header',
  BODY = 'missing body',
  ACTION = 'missing action',
  MESSAGE_ID = 'missing messageId',
  RESOURCE_URI = 'missing resourceUri',
  ENUMERATION_CONTEXT = 'missing enumerationContext',
  UNSUPPORTED_METHOD = 'unsupported method',
  INPUT = 'missing input',
  REQUESTED_STATE = 'missing requestedState',
  SELECTOR = 'missing selector',
  ROLE = 'missing role',
  REQUESTED_POWER_STATE_CHANGE = 'missing powerState',
  ADMIN_PASS_ENCRYPTION_TYPE = 'missing adminPassEncryptionType',
  ADMIN_PASSWORD = 'missing adminPassword',
  ETHERNET_PORT_OBJECT = 'missing ethernetPortObject',
  ENVIRONMENT_DETECTION_SETTING_DATA = 'missing environmentDetectionSettingData',
  CERTIFICATE_BLOB = 'missing certificateBlob',
  MP_SERVER = 'missing mpServer',
  REMOTE_ACCESS_POLICY_RULE = 'missing remoteAccessPolicyRule',
  BOOT_SETTING_DATA = 'missing bootSettingData',
  ADD_ALARM_DATA = 'missing alarmClockOccurrence',
  IEEE8021X_SETTINGS = 'missing ieee8021xSettings',
  OPT_IN_SERVICE_RESPONSE = 'missing OptInServiceResponse',
  OPT_IN_CODE = 'missing OptInCode',
  KEY_PAIR = 'missing KeyAlgorithm and/or KeyLength',
  DATA = 'missing data',
  NONCE = 'missing nonce',
  SIGNING_ALGORITHM = 'missing signingAlgorithm',
  DIGITAL_SIGNATURE = 'missing digitalSignature',
  IS_LEAF = 'missing isLeaf',
  IS_ROOT = 'missing isRoot',
  TLS_CREDENTIAL_CONTEXT = 'missing tlsCredentialContext',
  GENERAL_SETTINGS = 'missing generalSettings',
  PASSWORD = 'missing password',
  PKCS10Request = 'missing PKCS10Request',
  USERNAME = 'missing username',
  DIGEST_PASSWORD = 'missing digestPassword',
  InstanceID = 'missing InstanceID'
}

export class WSManMessageCreator {
  messageId: number = 0
  xmlCommonPrefix: string = '<?xml version="1.0" encoding="utf-8"?><Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:w="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns="http://www.w3.org/2003/05/soap-envelope">'
  xmlCommonEnd: string = '</Envelope>'
  anonymousAddress: string = 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous'
  defaultTimeout: string = 'PT60S'
  resourceUriBase: string
  constructor (resourceUriBase: string) {
    this.resourceUriBase = resourceUriBase
  }

  /**
   * Assembles the xml from the xmlCommonPrefix, header, body, and xmlCommonEnd
   * @param header Partial XML created by createHeader function
   * @param body Partial XML created by createBody or createCommonBody functions
   * @returns string
   */
  createXml = (header: string, body: string): string => this.xmlCommonPrefix + header + body + this.xmlCommonEnd

  /**
   * Creates a partial XML header
   * @param action WSMAN Action value based on DMTF schema
   * @param resourceUri WSMAN ResourceURI value based on DMTF schema
   * @param address WSMAN Address value based on DMTF schema
   * @param timeout WSMAN OperationTimeout value for commands to be executed - PT60S default
   * @param selector WSMAN Selector values for headers that require it
   * @returns string
   */
  createHeader = (action: string, wsmanClass: CIM.Classes | AMT.Classes | IPS.Classes, selector?: Selector, address?: string, timeout?: string): string => {
    let header: string = '<Header>'
    header += `<a:Action>${action}</a:Action><a:To>/wsman</a:To><w:ResourceURI>${this.resourceUriBase}${wsmanClass}</w:ResourceURI><a:MessageID>${(this.messageId++).toString()}</a:MessageID><a:ReplyTo>`
    if (address != null) { header += `<a:Address>${address}</a:Address>` } else { header += `<a:Address>${this.anonymousAddress}</a:Address>` }
    header += '</a:ReplyTo>'
    if (timeout != null) { header += `<w:OperationTimeout>${timeout}</w:OperationTimeout>` } else { header += `<w:OperationTimeout>${this.defaultTimeout}</w:OperationTimeout>` }
    if (selector != null) {
      header += this.createSelector(selector)
    }
    header += '</Header>'
    return header
  }

  /**
   * Creates a WSMAN string based on Selector Set information provided.  Can be used in header or body
   * @param selectorSet Selector data being passed in.  Could take many forms depending on the WSMAN call
   * @returns string
   */
  createSelector = (selectorSet: any): string => {
    if (selectorSet.name) return `<w:SelectorSet><w:Selector Name="${selectorSet.name}">${selectorSet.value}</w:Selector></w:SelectorSet>`
    let result = '<w:SelectorSet>'
    for (const propName in selectorSet) {
      result += '<w:Selector Name="' + propName + '">'
      if (selectorSet[propName].ReferenceParameters) {
        result += '<a:EndpointReference>'
        result += '<a:Address>' + selectorSet[propName].Address + '</a:Address><a:ReferenceParameters><w:ResourceURI>' + selectorSet[propName].ReferenceParameters.ResourceURI + '</w:ResourceURI><w:SelectorSet>'
        const selectorArray = selectorSet[propName].ReferenceParameters.SelectorSet.Selector
        if (Array.isArray(selectorArray)) {
          // TODO: Enable when selector is an array. No need for now.
          // for (let i = 0; i < selectorArray.length; i++) {
          //   result += '<w:Selector Name="${selectorArray[i].$.Name}">${selectorArray[i]._}</w:Selector>'
          // }
        } else {
          result += `<w:Selector Name="${selectorArray.$.Name}">${selectorArray._}</w:Selector>`
        }
        result += '</w:SelectorSet></a:ReferenceParameters></a:EndpointReference>'
      }
      result += '</w:Selector>'
    }
    result += '</w:SelectorSet>'
    return result
  }

  /**
   * Creates a WSMAN Body for methods listed.  For other methods use createBody()
   * @method Pull Methods.PULL
   * @method Enumerate Methods.ENUMERATE
   * @method Get Methods.GET
   * @method Delete Methods.DELETE
   * @method RequestStateChange Methods.REQUEST_STATE_CHANGE
   * @returns string
   */
  createCommonBody = {
    /**
     * Body used for Delete actions
     * @returns string
     */
    Delete: (): string => '<Body></Body>',
    /**
     * Body used for Enumerate actions
     * @returns string
     */
    Enumerate: (): string => '<Body><Enumerate xmlns="http://schemas.xmlsoap.org/ws/2004/09/enumeration" /></Body>',
    /**
     * Body used for Get actions
     * @returns string
     */
    Get: (): string => '<Body></Body>',
    /**
     * Body used for Pull actions
     * @param enumerationContext string returned from an Enumerate call.
     * @returns string
     */
    Pull: (enumerationContext: string): string => `<Body><Pull xmlns="http://schemas.xmlsoap.org/ws/2004/09/enumeration"><EnumerationContext>${enumerationContext}</EnumerationContext><MaxElements>999</MaxElements><MaxCharacters>99999</MaxCharacters></Pull></Body>`,
    /**
     * Body used for Create or Put actions
     * @param wsmanClass AMT.Classes, IPS.Classes, or CIM.Classes
     * @param data Object being applied to AMT
     * @returns string
     */
    CreateOrPut: (wsmanClass: AMT.Classes | IPS.Classes | CIM.Classes, data: any): string => this.createBody(wsmanClass, wsmanClass, data),
    /**
     * Body used for RequestStateChange actions
     * @param input namespace of the class being modified
     * @param requestedState state being set
     * @returns string
     */
    RequestStateChange: (input: string, requestedState: number): string => `<Body><h:RequestStateChange_INPUT xmlns:h="${input}"><h:RequestedState>${requestedState.toString()}</h:RequestedState></h:RequestStateChange_INPUT></Body>`
  }

  /**
   * Creates a WSMAN Body for custom methods
   * @param method string - methods not covered by createCommonBody()
   * @param resourceUriBase string - URI address of the resource
   * @param wsmanClass string - name of WSMAN class being used
   * @param data Object being converted into XML format
   * @returns string
   */
  createBody = (method: string, wsmanClass: string, data?: any): string => {
    this.processBody(data)
    let str = '<Body>'
    if (data) {
      str += `<h:${method} xmlns:h="${this.resourceUriBase}${wsmanClass}">`
      str += this.OBJtoXML(data)
      str += `</h:${method}>`
    } else {
      str += `<h:${method} xmlns:h="${this.resourceUriBase}${wsmanClass}" />`
    }
    str += '</Body>'
    return str
  }

  /**
   * Converts JavaScript object to XML
   * @param data JavaScript object
   * @returns string
   */
  OBJtoXML = (data: any): string => {
    let xml = ''
    for (const prop in data) {
      if (Array.isArray(data[prop])) {
        xml += ''
      } else {
        if (data[prop] != null) xml += `<${prop}>`
      }
      if (Array.isArray(data[prop])) {
        for (const arrayIdx in data[prop]) {
          xml += `<${prop}`
          for (const attr in data[prop][arrayIdx].$) {
            xml += ` ${attr}="${data[prop][arrayIdx].$[attr]}"`
          }
          xml += '>'
          xml += data[prop][arrayIdx]._ ? data[prop][arrayIdx]._ : data[prop][arrayIdx]
          xml += `</${prop}>`
        }
      } else if (typeof data[prop] === 'object') {
        xml += this.OBJtoXML(data[prop])
      } else {
        if (data[prop] != null) xml += data[prop]
      }
      if (Array.isArray(data[prop])) {
        xml += ''
      } else {
        if (data[prop] != null) xml += `</${prop}>`
      }
    }
    return xml
  }

  /**
   * Helper function for createBody() to ensure WSMAN namespaces are formatted correctly
   * @param data JavaScript object
   * @returns any
   */
  processBody = (data: any): any => {
    if (Array.isArray(data)) {
      return
    }
    for (const val in data) {
      switch (val) {
        case 'Address':
        case 'ReferenceParameters':
          this.prependObjectKey(data, val, 'a:')
          break
        case 'SelectorSet':
        case 'Selector':
        case 'ResourceURI':
          this.prependObjectKey(data, val, 'w:')
          break
        default:
          this.prependObjectKey(data, val, 'h:')
          break
      }
    }
  }

  /**
   * Helper function for processBody() to assist with formatting
   * @param data JavaScript object
   * @param key string
   * @param prefix string
   * @returns void
   */
  prependObjectKey = (data: object, key: string, prefix: string): void => {
    data[prefix + key] = data[key]
    if (typeof data[key] === 'object') {
      this.processBody(data[key])
    }
    delete data[key]
  }
}
