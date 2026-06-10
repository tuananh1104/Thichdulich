package com.example.thichdulich.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Data
@Component
public class PaymentProperties {
    @Value("${bank.accountNo:}")
    private String bankAccountNo;

    @Value("${bank.accountName:}")
    private String bankAccountName;

    @Value("${bank.bankCode:}")
    private String bankBankCode;

    @Value("${payos.endpoint:https://api-merchant.payos.vn/v2/payment-requests}")
    private String payosEndpoint;

    @Value("${payos.clientId:}")
    private String payosClientId;

    @Value("${payos.apiKey:}")
    private String payosApiKey;

    @Value("${payos.checksumKey:}")
    private String payosChecksumKey;

    @Value("${payos.returnUrl:}")
    private String payosReturnUrl;

    @Value("${payos.cancelUrl:}")
    private String payosCancelUrl;
}
