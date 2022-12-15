/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { WSManErrors, WSManMessageCreator, Selector } from '../WSMan'
import { Actions, Methods, Classes, Models, Types } from './'
import { AMT } from '../'

type AllActions = Actions

export interface IPSCall {
  method: Methods
  class: Classes
  enumerationContext?: string
  selector?: Selector
  requestedState?: number
  data?: any
  maxElements?: number
}
export class Messages {
  wsmanMessageCreator: WSManMessageCreator = new WSManMessageCreator()
  readonly resourceUriBase: string = 'http://intel.com/wbem/wscim/1/ips-schema/1/'

  private readonly enumerate = (action: Actions, ipsClass: Classes): string => {
    const header: string = this.wsmanMessageCreator.createHeader(action, `${this.resourceUriBase}${ipsClass}`)
    const body: string = this.wsmanMessageCreator.createCommonBody(Methods.ENUMERATE)
    return this.wsmanMessageCreator.createXml(header, body)
  }

  private readonly pull = (action: Actions, ipsClass: Classes, enumerationContext: string): string => {
    const header: string = this.wsmanMessageCreator.createHeader(action, `${this.resourceUriBase}${ipsClass}`)
    const body: string = this.wsmanMessageCreator.createCommonBody(Methods.PULL, enumerationContext)
    return this.wsmanMessageCreator.createXml(header, body)
  }

  private readonly get = (action: AllActions, ipsClass: Classes): string => {
    const header: string = this.wsmanMessageCreator.createHeader(action, `${this.resourceUriBase}${ipsClass}`)
    const body: string = this.wsmanMessageCreator.createCommonBody(Methods.GET)
    return this.wsmanMessageCreator.createXml(header, body)
  }

  private readonly put = (action: AllActions, ipsClass: Classes, data: any): string => {
    const header: string = this.wsmanMessageCreator.createHeader(action, `${this.resourceUriBase}${ipsClass}`)
    let body = 'NULL'
    if (data) {
      const key = Object.keys(data)[0]
      body = this.wsmanMessageCreator.createBody(ipsClass, this.resourceUriBase, ipsClass, data)
    }
    return this.wsmanMessageCreator.createXml(header, body)
  }

  private readonly delete = (action: Actions, ipsClass: Classes, selector: Selector): string => {
    const header = this.wsmanMessageCreator.createHeader(action, `${this.resourceUriBase}${ipsClass}`, null, null, selector)
    const body = this.wsmanMessageCreator.createCommonBody(Methods.DELETE)
    return this.wsmanMessageCreator.createXml(header, body)
  }

  switch = (ips: IPSCall): string => {
    switch (ips.method) {
      case Methods.GET:
        return this.get(Actions.GET, ips.class)
      case Methods.PUT:
        if (ips.data == null) { throw new Error(WSManErrors.BODY) }
        return this.put(Actions.PUT, ips.class, ips.data)
      case Methods.PULL:
        if (ips.enumerationContext == null) { throw new Error(WSManErrors.ENUMERATION_CONTEXT) }
        return this.pull(Actions.PULL, ips.class, ips.enumerationContext)
      case Methods.ENUMERATE:
        return this.enumerate(Actions.ENUMERATE, ips.class)
      case Methods.DELETE:
        if (ips.selector == null) { throw new Error(WSManErrors.SELECTOR) }
        return this.delete(Actions.DELETE, ips.class, ips.selector)
      default:
        throw new Error(WSManErrors.UNSUPPORTED_METHOD)
    }
  }

  OptInService = (method: Methods.GET | Methods.PUT | Methods.START_OPT_IN | Methods.CANCEL_OPT_IN | Methods.SEND_OPT_IN_CODE, optInCode?: Number, optInServiceResponse?: Models.OptInServiceResponse): string => {
    let header: string, body: string
    switch (method) {
      case Methods.GET:
        return this.get(Actions.GET, Classes.IPS_OPT_IN_SERVICE)
      case Methods.PUT:
        if (optInServiceResponse) {
          const key = Object.keys(optInServiceResponse)[0]
          return this.put(Actions.PUT, Classes.IPS_OPT_IN_SERVICE, optInServiceResponse[key])
        } else {
          throw new Error(WSManErrors.OPT_IN_SERVICE_RESPONSE)
        }
      case Methods.START_OPT_IN: {
        header = this.wsmanMessageCreator.createHeader(Actions.START_OPT_IN, `${this.resourceUriBase}${Classes.IPS_OPT_IN_SERVICE}`)
        body = this.wsmanMessageCreator.createBody('StartOptIn_INPUT', this.resourceUriBase, Classes.IPS_OPT_IN_SERVICE)
        return this.wsmanMessageCreator.createXml(header, body)
      }
      case Methods.SEND_OPT_IN_CODE: {
        header = this.wsmanMessageCreator.createHeader(Actions.SEND_OPT_IN_CODE, `${this.resourceUriBase}${Classes.IPS_OPT_IN_SERVICE}`)
        if (optInCode) {
          body = this.wsmanMessageCreator.createBody('SendOptInCode_INPUT', this.resourceUriBase, Classes.IPS_OPT_IN_SERVICE, { OptInCode: optInCode })
          return this.wsmanMessageCreator.createXml(header, body)
        } else {
          throw new Error(WSManErrors.OPT_IN_CODE)
        }
      }
      case Methods.CANCEL_OPT_IN: {
        header = this.wsmanMessageCreator.createHeader(Actions.CANCEL_OPT_IN, `${this.resourceUriBase}${Classes.IPS_OPT_IN_SERVICE}`)
        body = this.wsmanMessageCreator.createBody('CancelOptIn_INPUT', this.resourceUriBase, Classes.IPS_OPT_IN_SERVICE)
        return this.wsmanMessageCreator.createXml(header, body)
      }
      default:
        throw new Error(WSManErrors.UNSUPPORTED_METHOD)
    }
  }

  /**
   * Accesses a representation of HostBasedSetupService.
   * @method GET - Gets the representation of HostBasedSetupService
   * @method SETUP - Requires adminPassEncryptionType and adminPassword.  Setup Intel(R) AMT from local host. This function requires OS administrator rights, and moves Intel(R) AMT from "Pre Provisioned" state to "Post Provisioned" state. The control mode after this method is run will be "Client". This method also allows the configuring agent to sign the setup operation with a certificate. The certificate hash will be kept in the corresponding provisioning record
   * @method ADMIN_SETUP - Requires adminPassEncryptionType, adminPassword, mcNonce, signingAlgorithm, and digitalSignature.  Setup Intel(R) AMT from the local host, resulting in Admin Setup Mode. Requires OS administrator rights, and moves Intel(R) AMT from "Pre Provisioned" state to "Post Provisioned" state. The control mode after this method is run will be "Admin".
   * @method ADD_NEXT_CERT_IN_CHAIN - Requires cert, isLeaf, and isRoot.  Add a certificate to the provisioning certificate chain, to be used by AdminSetup or UpgradeClientToAdmin methods.
   * @param adminPassEncryptionType The encryption type of the network admin password. Only HTTP-MD5 is supported. The values are the same as the CIM_Account.UserPasswordEncryptionAlgorithm field
   * @remark ValueMap={0, 1, 2, ..}
   * @remark Values={None, Other, HTTP Digest MD5(A1), DMTF Reserved}
   * @param adminPassword New network admin password to be set by this command, encrypted using the encryption type algorithm
   * @remark OctetString
   * @param mcNonce A random nonce value generated by the configuration agent.Required if the digital signature is provided.needs to be concatenated after the configuration nonce and signed together with the attached certificate's private key
   * @remark OctetString
   * @param signingAlgorithm The signing algorithm used to sign the setup operation.
   * @remark ValueMap={0, 1, 2, ..}
   * @remark Values={None, Other, RSA_SHA-2_256, DMTF Reserved}
   * @param digitalSignature A digital signature of the ConfigurationNonce and the McNonce concatenated. If this information is provided, AMT will validate the signature before accepting the command.
   * @remark OctetString
   * @param cert The next certificate to add to the chain
   * @remark OctetString
   * @param isLeaf true, when the current certificate is leaf certificate
   * @param isRoot true, when the current certificate is root. Marks end of the certificate chain
   * @returns string
   */
  HostBasedSetupService = (method: Methods.GET | Methods.SETUP | Methods.ADMIN_SETUP | Methods.ADD_NEXT_CERT_IN_CHAIN, adminPassEncryptionType?: Types.HostBasedSetupService.AdminPassEncryptionType, adminPassword?: string, mcNonce?: string, signingAlgorithm?: Types.HostBasedSetupService.SigningAlgorithm, digitalSignature?: string, cert?: string, isLeaf?: boolean, isRoot?: boolean): string => {
    // Consider breaking add_next_cert_in_chain out into its own method
    switch (method) {
      case Methods.GET: {
        return this.get(Actions.GET, Classes.IPS_HOST_BASED_SETUP_SERVICE)
      }
      case Methods.SETUP: {
        if (adminPassEncryptionType == null) { throw new Error(WSManErrors.ADMIN_PASS_ENCRYPTION_TYPE) }
        if (adminPassword == null) { throw new Error(WSManErrors.ADMIN_PASSWORD) }
        const header: string = this.wsmanMessageCreator.createHeader(Actions.SETUP, `${this.resourceUriBase}${Classes.IPS_HOST_BASED_SETUP_SERVICE}`)
        const body: string = this.wsmanMessageCreator.createBody('Setup_INPUT', this.resourceUriBase, Classes.IPS_HOST_BASED_SETUP_SERVICE, {
          NetAdminPassEncryptionType: adminPassEncryptionType.toString(),
          NetworkAdminPassword: adminPassword
        })
        return this.wsmanMessageCreator.createXml(header, body)
      }
      case Methods.ADMIN_SETUP: {
        if (adminPassEncryptionType == null) { throw new Error(WSManErrors.ADMIN_PASS_ENCRYPTION_TYPE) }
        if (adminPassword == null) { throw new Error(WSManErrors.ADMIN_PASSWORD) }
        if (mcNonce == null) { throw new Error(WSManErrors.NONCE) }
        if (signingAlgorithm == null) { throw new Error(WSManErrors.SIGNING_ALGORITHM) }
        if (digitalSignature == null) { throw new Error(WSManErrors.DIGITAL_SIGNATURE) }
        const header: string = this.wsmanMessageCreator.createHeader(Actions.ADMIN_SETUP, `${this.resourceUriBase}${Classes.IPS_HOST_BASED_SETUP_SERVICE}`)
        const body: string = this.wsmanMessageCreator.createBody('AdminSetup_INPUT', this.resourceUriBase, Classes.IPS_HOST_BASED_SETUP_SERVICE, {
          NetAdminPassEncryptionType: adminPassEncryptionType,
          NetworkAdminPassword: adminPassword,
          McNonce: mcNonce,
          SigningAlgorithm: signingAlgorithm,
          DigitalSignature: digitalSignature
        })
        return this.wsmanMessageCreator.createXml(header, body)
      }
      case Methods.ADD_NEXT_CERT_IN_CHAIN: {
        if (cert == null) { throw new Error(WSManErrors.CERTIFICATE_BLOB) }
        if (isLeaf == null) { throw new Error(WSManErrors.IS_LEAF) }
        if (isRoot == null) { throw new Error(WSManErrors.IS_ROOT) }
        const header: string = this.wsmanMessageCreator.createHeader(Actions.ADD_NEXT_CERT_IN_CHAIN, `${this.resourceUriBase}${Classes.IPS_HOST_BASED_SETUP_SERVICE}`)
        const body: string = this.wsmanMessageCreator.createBody('AddNextCertInChain_INPUT', this.resourceUriBase, Classes.IPS_HOST_BASED_SETUP_SERVICE, {
          NextCertificate: cert,
          IsLeafCertificate: isLeaf,
          IsRootCertificate: isRoot
        })
        return this.wsmanMessageCreator.createXml(header, body)
      }
      default:
        throw new Error(WSManErrors.UNSUPPORTED_METHOD)
    }
  }

  /**
   * Accesses a representation of AlarmClockOccurrence.
   * @method PULL - Requires enumerationContext.  Pulls instances of AlarmClockOccurrence, following an Enumerate operation.
   * @method ENUMERATE - Enumerates the instances of AlarmClockOccurrence
   * @method DELETE - Requires selector.  Deletes the AlarmClockOccurrence.
   * @param enumerationContext string returned from an ENUMERATE call.
   * @param selector Selector Object.
   * @returns string
   */
  AlarmClockOccurrence = (method: Methods.PULL | Methods.ENUMERATE | Methods.DELETE, enumerationContext?: string, selector?: Selector): string => {
    switch (method) {
      case Methods.PULL: {
        if (enumerationContext == null) { throw new Error(WSManErrors.ENUMERATION_CONTEXT) }
        return this.pull(Actions.PULL, Classes.IPS_ALARM_CLOCK_OCCURRENCE, enumerationContext)
      }
      case Methods.ENUMERATE: {
        return this.enumerate(Actions.ENUMERATE, Classes.IPS_ALARM_CLOCK_OCCURRENCE)
      }
      case Methods.DELETE: {
        if (selector == null) { throw new Error(WSManErrors.SELECTOR) }
        return this.delete(Actions.DELETE, Classes.IPS_ALARM_CLOCK_OCCURRENCE, selector)
      }
      default:
        throw new Error(WSManErrors.UNSUPPORTED_METHOD)
    }
  }

  /**
   * Accesses a representation of IEEE8021xSettings
   * @method PULL - Requires enumerationContext.  Pulls instances of IEEE8021xSettings, following an Enumerate operation.
   * @method ENUMERATE - Enumerates the instances of IEEE8021xSettings
   * @method PUT - Requires IEEE8021xSettings Object.  Changes properties of IEEE8021xSettings.
   * @method SET_CERTIFICATES - Requires serverCertificateIssuer and clientCertificate.  Sets certificates for IEEE8021xSettings in AMT
   * @param enumerationContext string returned from an ENUMERATE call.
   * @param ieee8021xSettings IEEE8021xSettings Object
   * @param serverCertificateIssuer AMT_PublicKeyCertificate Object
   * @param clientCertificate AMT_PublicKeyCertificate
   * @returns string
   */
  IEEE8021xSettings = (method: Methods.PULL | Methods.ENUMERATE | Methods.PUT | Methods.SET_CERTIFICATES, enumerationContext?: string, ieee8021xSettings?: Models.IEEE8021xSettings, serverCertificateIssuer?: AMT.Models.PublicKeyCertificate, clientCertificate?: AMT.Models.PublicKeyCertificate): string => {
    switch (method) {
      case Methods.PULL:
      case Methods.ENUMERATE: {
        return this.switch({ method: method, class: Classes.IPS_IEEE8021X_SETTINGS, enumerationContext })
      }
      case Methods.PUT: {
        if (ieee8021xSettings == null) { throw new Error(WSManErrors.IEEE8021X_SETTINGS) }
        return this.put(Actions.PUT, Classes.IPS_IEEE8021X_SETTINGS, ieee8021xSettings)
      }
      case Methods.SET_CERTIFICATES: {
        if (serverCertificateIssuer == null || clientCertificate == null) { throw new Error(WSManErrors.CERTIFICATE_BLOB) }
        const header: string = this.wsmanMessageCreator.createHeader(Actions.SET_CERTIFICATES, this.resourceUriBase, Classes.IPS_IEEE8021X_SETTINGS)
        const body: string = this.wsmanMessageCreator.createBody(Methods.SET_CERTIFICATES, this.resourceUriBase, Classes.IPS_IEEE8021X_SETTINGS, {
          ServerCertificateIssuer: serverCertificateIssuer,
          ClientCertificate: clientCertificate
        })
        return this.wsmanMessageCreator.createXml(header, body)
      }
      default:
        throw new Error(WSManErrors.UNSUPPORTED_METHOD)
    }
  }

  IEEE8021xCredentialContext = (method: Methods.PULL | Methods.ENUMERATE, enumerationContext?: string): string => {
    switch (method) {
      case Methods.PULL:
      case Methods.ENUMERATE: {
        return this.switch({ method: method, class: Classes.IPS_IEEE8021X_CREDENTIAL_CONTEXT, enumerationContext })
      }
    }
  }
}
